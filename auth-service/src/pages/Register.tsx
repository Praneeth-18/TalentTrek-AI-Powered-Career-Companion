import { RegisterForm } from "@/components/auth/RegisterForm";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;