import mysql.connector
from mysql.connector import Error
from typing import List, Optional
from datetime import datetime
import boto3
from botocore.config import Config
from .models import Interview, InterviewFeedback, ChatMessage, DsaQuestionBank
from config import MYSQL_CONFIG, AWS_CONFIG
import os


class Database:
    def __init__(self):
        self.mysql_conn = None
        self.dynamodb = None
        self.chat_table = None
        self.connect()

    def connect(self):
        try:
            self.mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)

            # Initialize DynamoDB
            try:
                # Check for local development environment
                if AWS_CONFIG['environment'] == 'development':
                    # Using a local DynamoDB for development
                    print("Using local DynamoDB for development")
                    self.dynamodb = boto3.resource('dynamodb',
                                                   endpoint_url=AWS_CONFIG['dynamodb_endpoint'],
                                                   region_name=AWS_CONFIG['region'],
                                                   aws_access_key_id=AWS_CONFIG['aws_access_key_id'],
                                                   aws_secret_access_key=AWS_CONFIG['aws_secret_access_key'])
                else:
                    # Using AWS DynamoDB for production
                    self.dynamodb = boto3.resource('dynamodb',
                                                   region_name=AWS_CONFIG['region'],
                                                   aws_access_key_id=AWS_CONFIG['aws_access_key_id'],
                                                   aws_secret_access_key=AWS_CONFIG['aws_secret_access_key'])

                # Try to get the table
                self.chat_table = self.dynamodb.Table('ChatMessages')
                table_status = self.chat_table.table_status
                print(f"DynamoDB table status: {table_status}")
            except Exception as e:
                print(f"DynamoDB initialization error: {str(e)}")
                self.dynamodb = None
                self.chat_table = None

        except Error as e:
            print(f"Error connecting to database: {e}")
            raise

    def create_interview(self, interview: Interview) -> Interview:
        cursor = self.mysql_conn.cursor()
        try:
            query = """
                INSERT INTO interviews (
                    id, title, job_type, candidate_name, company, created_at, 
                    status, type, updated_at, question_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                interview.id, interview.title, interview.job_type,
                interview.candidate_name, interview.company, interview.created_at,
                interview.status.value, interview.type.value,
                interview.updated_at, interview.question_id
            )
            cursor.execute(query, values)
            self.mysql_conn.commit()
            return interview
        except Error as e:
            print(f"Error creating interview: {e}")
            raise
        finally:
            cursor.close()

    # Add this method to your Database class in database.py

    def get_interview_summaries(self):
        """Get summarized interview data (ID, title, score, feedback only)."""
        cursor = self.mysql_conn.cursor(dictionary=True)
        try:
            query = """
                SELECT i.id,i.title,f.score,f.comments as feedback,i.created_at from mock_interview_platform.interviews i join mock_interview_platform.interview_feedback f on (i.id=f.interview_id) ORDER BY 
                    i.created_at DESC
            """
            cursor.execute(query)
            results = cursor.fetchall()

            # Process the results to ensure consistent format
            summaries = []
            for result in results:
                # If feedback is too long, truncate it
                if result.get('feedback') and len(result['feedback']) > 400:
                    result['feedback'] = result['feedback'][:397] + '...'

                summaries.append({
                    'interviewId': result['id'],
                    'title': result['title'],
                    'score': result['score'],
                    'feedback': result['feedback'],
                    'created_at':result['created_at']
                })

            return summaries
        except Exception as e:
            print(f"Error getting interview summaries: {e}")
            raise
        finally:
            cursor.close()


    def get_interview(self, interview_id: str) -> Optional[Interview]:
        cursor = self.mysql_conn.cursor(dictionary=True)
        try:
            query = "SELECT * FROM interviews WHERE id = %s"
            cursor.execute(query, (interview_id,))
            result = cursor.fetchone()
            if result:
                return Interview(**result)
            return None
        except Error as e:
            print(f"Error getting interview: {e}")
            raise
        finally:
            cursor.close()

    def update_interview(self, interview: Interview) -> Interview:
        cursor = self.mysql_conn.cursor()
        try:
            query = """
                UPDATE interviews SET
                    title = %s, job_type = %s, candidate_name = %s, company = %s,
                    status = %s, feedback_summary = %s, score = %s, 
                    type = %s, updated_at = %s
                WHERE id = %s
            """
            values = (
                interview.title, interview.job_type, interview.candidate_name,
                interview.company, interview.status.value, interview.feedback_summary,
                interview.score, interview.type.value,
                datetime.now(), interview.id
            )
            cursor.execute(query, values)
            self.mysql_conn.commit()
            return interview
        except Error as e:
            print(f"Error updating interview: {e}")
            raise
        finally:
            cursor.close()

    def save_chat_message(self, message: ChatMessage) -> ChatMessage:
        if not self.dynamodb or not self.chat_table:
            print("DynamoDB not available, skipping chat message save")
            return message

        try:
            # Convert datetime to ISO string format for sorting
            timestamp_str = message.timestamp.isoformat()

            # Create the DynamoDB item
            item = {
                'message_id': message.message_id,
                'interview_id': message.interview_id,
                'role': message.role,
                'content': message.content,
                'timestamp': timestamp_str
            }

            # Save to DynamoDB
            response = self.chat_table.put_item(Item=item)
            print(f"Saved chat message {message.message_id} to DynamoDB - Response: {response}")
            return message
        except Exception as e:
            print(f"Error saving chat message to DynamoDB: {str(e)}")
            # Return the message anyway to not break application flow
            return message


    def get_all_interviews(self) -> List[Interview]:
        """Get all interviews from the database."""
        cursor = self.mysql_conn.cursor(dictionary=True)
        try:
            query = "SELECT * FROM interviews ORDER BY created_at DESC"
            cursor.execute(query)
            results = cursor.fetchall()
            
            interviews = []
            for result in results:
                interview = Interview(**result)
                interviews.append(interview)
            
            return interviews
        except Error as e:
            print(f"Error getting all interviews: {e}")
            raise
        finally:
            cursor.close()


    def get_interviews_by_user(self, username: str) -> List[Interview]:
        """Get all interviews for a specific user."""
        cursor = self.mysql_conn.cursor(dictionary=True)
        try:
            query = """
                SELECT i.*, 
                    (SELECT comments FROM interview_feedback 
                        WHERE interview_id = i.id AND category = 'final_feedback' 
                        ORDER BY created_at DESC LIMIT 1) as feedback_summary
                FROM interviews i
                WHERE i.candidate_name = %s
             ORDER BY i.created_at DESC
            """
            cursor.execute(query, (username,))
            results = cursor.fetchall()
        
            interviews = []
            for result in results:
                # If feedback_summary is too long, truncate it
                if result.get('feedback_summary') and len(result['feedback_summary']) > 500:
                    result['feedback_summary'] = result['feedback_summary'][:497] + '...'
                
                interview = Interview(**result)
                interviews.append(interview)
        
            return interviews
        except Error as e:
            print(f"Error getting interviews for user {username}: {e}")
            raise
        finally:
            cursor.close()
    def get_chat_history(self, interview_id: str) -> List[ChatMessage]:
        if not self.dynamodb or not self.chat_table:
            print("DynamoDB not available, returning empty chat history")
            return []

        try:
            # Query using the GSI for all messages of this interview, sorted by timestamp
            response = self.chat_table.query(
                IndexName='interview-time-index',
                KeyConditionExpression='interview_id = :id',
                ExpressionAttributeValues={':id': interview_id}
            )

            messages = []
            for item in response.get('Items', []):
                try:
                    # Convert the timestamp string back to datetime
                    timestamp = datetime.fromisoformat(item['timestamp'])

                    # Create a ChatMessage object
                    message = ChatMessage(
                        message_id=item['message_id'],
                        interview_id=item['interview_id'],
                        role=item['role'],
                        content=item['content'],
                        timestamp=timestamp
                    )
                    messages.append(message)
                except Exception as e:
                    print(f"Error parsing message item: {str(e)}, Item: {item}")

            print(f"Retrieved {len(messages)} messages for interview {interview_id}")
            return messages
        except Exception as e:
            print(f"Error getting chat history from DynamoDB: {str(e)}")
            return []

    def save_feedback(self, feedback: InterviewFeedback) -> InterviewFeedback:
        cursor = self.mysql_conn.cursor()
        try:
            query = """
                INSERT INTO interview_feedback (
                    interview_id, category, score, comments
                ) VALUES (%s, %s, %s, %s)
            """
            values = (
                feedback.interview_id, feedback.category,
                feedback.score, feedback.comments
            )
            cursor.execute(query, values)
            self.mysql_conn.commit()
            feedback.id = cursor.lastrowid
            return feedback
        except Error as e:
            print(f"Error saving feedback: {e}")
            raise
        finally:
            cursor.close()

    def delete_chat_history(self, interview_id: str) -> bool:
        """Delete all chat messages for an interview."""
        if not self.dynamodb or not self.chat_table:
            print("DynamoDB not available, skipping chat history deletion")
            return False

        try:
            # Get all messages for this interview
            messages = self.get_chat_history(interview_id)

            # Delete each message using batch writer for efficiency
            if messages:
                with self.chat_table.batch_writer() as batch:
                    for message in messages:
                        batch.delete_item(
                            Key={
                                'message_id': message.message_id
                            }
                        )

                print(f"Deleted {len(messages)} messages for interview {interview_id}")
            else:
                print(f"No messages found to delete for interview {interview_id}")

            return True
        except Exception as e:
            print(f"Error deleting chat history: {str(e)}")
            raise

    def get_question_by_id(self, question_id: str) -> Optional[DsaQuestionBank]:
        """Get a specific question by ID from the question bank."""
        cursor = self.mysql_conn.cursor(dictionary=True)
        try:
            query = "SELECT * FROM question_bank WHERE id = %s"
            cursor.execute(query, (question_id,))
            result = cursor.fetchone()
            if result:
                # Include question ID in the text
                question_text = f"{result['text']}\n\nQuestion ID: {result['id']}"
                return DsaQuestionBank(
                    id=str(result['id']),
                    text=question_text,
                    difficulty=result['difficulty'],
                    follow_ups=result['follow_ups'].split(',') if result['follow_ups'] else None
                )
            return None
        except Error as e:
            print(f"Error getting question by ID: {e}")
            raise
        finally:
            cursor.close()

    def get_random_question(self, difficulty: Optional[int] = None) -> Optional[DsaQuestionBank]:
        """Get a random question from the question bank."""
        cursor = self.mysql_conn.cursor(dictionary=True)
        try:
            query = "SELECT * FROM question_bank"
            params = []
            if difficulty:
                query += " WHERE difficulty = %s"
                params.append(difficulty)
            query += " ORDER BY RAND() LIMIT 1"

            cursor.execute(query, params)
            result = cursor.fetchone()
            if result:
                # Include question ID in the text

                return DsaQuestionBank(
                    id=str(result['id']),
                    text=result['text'],
                    difficulty=result['difficulty'],
                    follow_ups=result['follow_ups'].split(',') if result['follow_ups'] else None
                )
            return None
        except Error as e:
            print(f"Error getting random question: {e}")
            raise
        finally:
            cursor.close()

    def close(self):
        if self.mysql_conn:
            self.mysql_conn.close()