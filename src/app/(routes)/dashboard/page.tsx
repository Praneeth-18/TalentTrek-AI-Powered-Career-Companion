import { Suspense } from 'react';
import { JobListings } from '@/components/job-listings/JobListings';
import { PageHeader } from '@/components/PageHeader';
import { LoadingGrid } from '@/components/ui/loading-spinner';
import { pgPool, getRedactedDatabaseUrl } from '@/lib/db-connector';

// Import the client component directly
import JobListingsClient from './client';

// Log database connection info at startup
console.log(`Dashboard using database: ${getRedactedDatabaseUrl()}`);

// Constants
const ITEMS_PER_PAGE = 200;

type CategoryStats = {
  category: string;
  count: number;
  totalPages: number;
};

// Define job type
type DbJobRow = {
  id: number;
  position_title: string;
  company: string;
  location?: string;
  work_model?: string;
  job_category?: string;
  posting_date: Date;
  apply_link?: string;
  actual_apply_link?: string;
  salary?: string;
  qualifications?: string;
  company_size?: string;
  company_industry?: string;
  h1b_sponsored?: boolean;
  is_active?: boolean;
  is_new_grad?: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_seen_at?: Date;
  content_hash?: string;
};

const calculateTotalPages = (count: number) => Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));

async function getJobListings(page: number | string = 1, category: string = 'Software Engineering') {
  try {
    console.log('getJobListings called with:', { page, category });
    
    // Check if pool is available
    if (!pgPool) {
      console.error('Database pool not available');
      return { jobs: [], totalPages: 0, allCategories: [] };
    }
    
    // Convert page to number if it's a string
    const pageNumber = typeof page === 'string' ? parseInt(page) : page;
    
    // Calculate pagination values
    const offset = (pageNumber - 1) * ITEMS_PER_PAGE;
    const limit = ITEMS_PER_PAGE;

    // Define where clause based on category
    const whereClause = category 
      ? `WHERE job_category = $1` 
      : ``;
    
    // Get paginated job listings
    const jobsQuery = `
      SELECT * FROM job_listings 
      ${whereClause}
      ORDER BY posting_date DESC
      LIMIT $${category ? 2 : 1} OFFSET $${category ? 3 : 2}
    `;
    
    const jobsParams = category 
      ? [category, limit, offset] 
      : [limit, offset];
    
    console.log('Executing query:', { jobsQuery, jobsParams });
    const jobsResult = await pgPool.query(jobsQuery, jobsParams);
    console.log(`Retrieved ${jobsResult.rows.length} jobs from database`);
    
    // Count total jobs for pagination
    const countQuery = `SELECT COUNT(*) FROM job_listings ${whereClause}`;
    const countParams = category ? [category] : [];
    const countResult = await pgPool.query(countQuery, countParams);
    
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = calculateTotalPages(totalCount);
    console.log(`Total count: ${totalCount}, Total pages: ${totalPages}`);
    
    // Get all unique categories
    const categoriesResult = await pgPool.query(
      `SELECT DISTINCT job_category FROM job_listings ORDER BY job_category`
    );
    
    // Process categories from the database only
    const allCategories = categoriesResult.rows
      .map((c: { job_category: string | null }) => c.job_category || 'Uncategorized')
      .filter((c: string) => c !== null)
      .sort();

    console.log(`Job categories found:`, allCategories);
    console.log(`Total jobs fetched:`, jobsResult.rows.length);
    
    // Transform jobs data to match expected format in UI
    const jobs = jobsResult.rows.map((row: DbJobRow) => ({
      id: row.id,
      positionTitle: row.position_title,
      company: row.company,
      location: row.location,
      workModel: row.work_model,
      jobCategory: row.job_category,
      postingDate: row.posting_date,
      applyLink: row.apply_link,
      actualApplyLink: row.actual_apply_link,
      salary: row.salary,
      qualifications: row.qualifications,
      companySize: row.company_size,
      companyIndustry: row.company_industry,
      h1bSponsored: row.h1b_sponsored,
      isActive: row.is_active,
      isNewGrad: row.is_new_grad,
      createdAt: row.created_at || new Date(),
      updatedAt: row.updated_at || new Date(),
      lastSeenAt: row.last_seen_at || new Date(),
      contentHash: row.content_hash || ''
    }));
    
    // Get raw H1B sponsored jobs 
    const h1bJobsResult = await pgPool.query(
      `SELECT id, position_title, company, h1b_sponsored FROM job_listings WHERE h1b_sponsored = TRUE`
    );

    console.log("Raw h1bSponsored values from database:");
    console.log(`Found ${h1bJobsResult.rows.length} jobs with h1bSponsored=true in database`);
    h1bJobsResult.rows.slice(0, 8).forEach((job: { position_title: string; company: string; h1b_sponsored: boolean }) => {
      console.log(`${job.position_title} (${job.company}): h1bSponsored=${job.h1b_sponsored}`);
    });
    
    return { jobs, totalPages, allCategories };
  } catch (error) {
    console.error('Error fetching job listings:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    // Return empty results on error
    return { jobs: [], totalPages: 0, allCategories: [] };
  }
}

async function getCategoryStats(): Promise<CategoryStats[]> {
  try {
    if (!pgPool) {
      console.error('Database pool not available');
      return [];
    }
    
    // Get counts for each category
    const result = await pgPool.query(
      `SELECT job_category, COUNT(*) as count 
       FROM job_listings 
       GROUP BY job_category 
       ORDER BY job_category`
    );
    
    const stats = result.rows.map((cat: { job_category: string | null; count: string }) => ({
      category: cat.job_category || 'Uncategorized',
      count: parseInt(cat.count),
      totalPages: calculateTotalPages(parseInt(cat.count)),
    }));
    
    // Make "Software Engineering" appear first in the list
    const sortedStats = stats.sort((a: CategoryStats, b: CategoryStats) => {
      if (a.category === 'Software Engineering') return -1;
      if (b.category === 'Software Engineering') return 1;
      return a.category.localeCompare(b.category);
    });
    
    return sortedStats;
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return [];
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { 
    page?: string; 
    category?: string; 
    h1b?: string; 
    newgrad?: string; 
    workType?: string;
  };
}) {
  console.log("Starting dashboard page render");
  
  // Clone searchParams safely to avoid sync access violations
  const params = searchParams ? {...searchParams} : {};
  
  // Extract values from searchParams 
  const pageParam = params.page || '';
  const categoryParam = params.category || '';
  
  // Parse page number with fallback to 1
  const page = pageParam ? parseInt(pageParam) : 1;
  const currentPage = isNaN(page) ? 1 : page;
  const category = categoryParam || 'Software Engineering';
  
  console.log("Before getJobListings:", { currentPage, category });
  try {
    // Verify database connection is valid before querying
    if (!pgPool) {
      console.error("Database pool not available for dashboard");
      throw new Error("Database connection not available");
    }
    
    const { jobs, totalPages, allCategories } = await getJobListings(currentPage, category);
    console.log("Got job listings:", { 
      jobCount: jobs.length, 
      totalPages, 
      categoryCount: allCategories.length,
      currentPage
    });

    // Get all category statistics for showing counts and pagination
    const categoryStats = await getCategoryStats();
    console.log("Got category stats:", { categoryStatsCount: categoryStats.length });

    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader
          heading="Job Listings Portal"
          text="Find and apply to the best tech jobs available"
        />
        <Suspense fallback={
          <div className="py-4">
            <LoadingGrid count={12} />
          </div>
        }>
          <JobListingsClient 
            initialJobs={jobs} 
            totalPages={totalPages} 
            currentPage={currentPage} 
            allCategories={allCategories}
            selectedCategory={category}
            categoryStats={categoryStats}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error in dashboard page:", error);
    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader
          heading="Job Listings Portal"
          text="Find and apply to the best tech jobs available"
        />
        <div className="text-center p-10 section-card">
          <div className="inline-block bg-red-500/70 text-white px-4 py-2 rounded-lg font-medium">
            Error loading job listings. Please try again later.
          </div>
        </div>
      </div>
    );
  }
} 