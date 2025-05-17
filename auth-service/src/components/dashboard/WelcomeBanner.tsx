import { useAuth } from "@/contexts/AuthContext";
import { Icons } from "@/components/icons";

export function WelcomeBanner() {
  const { user } = useAuth();

  return (
    <div className="text-center mb-12">
      <div className="inline-block mb-4 p-2 bg-white rounded-full shadow-md">
        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
          <Icons.user className="h-8 w-8 text-white" />
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        Welcome, {user?.firstName}!
      </h1>
      <p className="text-gray-600 max-w-xl mx-auto">
        {user?.userType === 'interviewer' 
          ? 'You are ready to help others succeed on their career journey by providing valuable feedback and guidance.' 
          : 'Ready to ace your next interview? Access our resources to prepare effectively and build confidence.'}
      </p>
    </div>
  );
} 