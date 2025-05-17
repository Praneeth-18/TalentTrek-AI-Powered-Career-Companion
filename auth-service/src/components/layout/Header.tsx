import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/icons";

interface HeaderProps {
  username: string | null;
}

export function Header({ username }: HeaderProps) {
  const { user, signOut } = useAuth();
  
  // Get role color class based on user type
  const getRoleColorClass = () => {
    return user?.userType === 'interviewer' 
      ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white" 
      : "bg-gradient-to-r from-purple-600 to-purple-400 text-white";
  };
  
  // Get avatar initials from user's name
  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <Icons.user className="h-5 w-5 text-white" />
          </div>
          <span className="ml-2 font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            TalentTrek
          </span>
        </div>
        
        {/* User profile and role in top right */}
        <div className="flex items-center gap-3">
          {user?.userType && (
            <Badge className={`${getRoleColorClass()} shadow-sm`}>
              {user.userType === 'interviewer' ? 'Interviewer' : 'Interviewee'}
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border-2 border-gray-200 hover:border-primary shadow-sm hover:shadow transition-all">
                <Avatar className="h-full w-full">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={user?.firstName || "User"} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Icons.user className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {username && (
                <DropdownMenuItem>
                  <Icons.userTie className="mr-2 h-4 w-4" />
                  <span>Username: {username}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Icons.settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <Icons.logout className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 