import { Compass } from "lucide-react";
import { Button, Card, CardContent, EmptyState } from "@travio/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <EmptyState
            icon={<Compass size={20} />}
            title="Page not found"
            description="The page you're looking for doesn't exist or has moved."
            action={
              <Button asChild>
                <a href="/">Go to the home page</a>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
