import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { LinkedAccountsManager } from "@/components/SocialLoginButtons";

export function LinkedAccountsCard() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Linked Accounts
        </CardTitle>
        <CardDescription>Connect Google or Apple for faster sign-in.</CardDescription>
      </CardHeader>
      <CardContent>
        <LinkedAccountsManager />
      </CardContent>
    </Card>
  );
}
