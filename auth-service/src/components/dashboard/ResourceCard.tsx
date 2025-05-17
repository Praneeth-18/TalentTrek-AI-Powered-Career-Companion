import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons";

export function ResourceCard() {
  const { user } = useAuth();

  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-100 to-blue-100">
            <Icons.info className="h-7 w-7 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Learning Resources</h3>
            <p className="text-sm text-gray-500">Access materials to enhance your skills</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          {user?.userType === 'interviewer'
            ? 'Browse our library of interview questions, frameworks, and evaluation criteria to help candidates excel.'
            : 'Explore our collection of practice problems, interview tips, and industry insights to prepare for success.'}
        </p>
        <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          Explore Resources
        </Button>
      </CardContent>
    </Card>
  );
} 