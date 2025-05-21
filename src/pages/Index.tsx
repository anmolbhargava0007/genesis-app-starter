
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Welcome to Your App</CardTitle>
            <CardDescription>
              Start building something amazing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is a clean, empty application template. You can now add components, 
              features, and functionality to build your project.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button>Get Started</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
