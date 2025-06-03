import { RegisterForm } from '@/components/Auth/RegisterForm';
import { Card, CardContent } from '@/components/ui/card';

export default function Register() {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto border-0">
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
} 