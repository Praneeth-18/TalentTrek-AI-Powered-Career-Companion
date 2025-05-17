import { Layout } from "@/components/layout/Layout";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { ResourceCard } from "@/components/dashboard/ResourceCard";
import { useUsername } from "@/hooks/useUsername";

export default function Dashboard() {
  const { username } = useUsername();

  return (
    <Layout username={username}>
      <WelcomeBanner />
      
      <div className="max-w-md mx-auto">
        <ResourceCard />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            We're continuously improving TalentTrek to better serve your needs.
            <br />Check back soon for new features and resources!
          </p>
        </div>
      </div>
    </Layout>
  );
}