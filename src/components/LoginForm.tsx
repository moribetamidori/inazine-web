"use client";

import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (isSignUp) {
        await signUp(email, password);

        setError(
          "Please check your email to verify your account before logging in."
        );
        setIsSignUp(false);
        setEmail("");
        setPassword("");
        return;
      } else {
        await signIn(email, password);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) throw new Error("No user found");
        if (!user?.email_confirmed_at) {
          throw new Error("Please verify your email before logging in");
        }

        const { data: existingUser } = await supabase
          .from("users")
          .select()
          .eq("id", user.id)
          .single();

        if (!existingUser) {
          const { error: insertError } = await supabase
            .from("users")
            .insert({ email: user.email, id: user.id });

          if (insertError) {
            console.error("Error inserting user:", {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint,
            });
            throw insertError;
          }
        }

        setEmail("");
        setPassword("");

        // After successful login, redirect to home page
        window.location.href = "/";
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isSignUp ? "Create Account" : "Welcome to InaZine"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <div className="flex flex-col space-y-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200"
          >
            {isLoading ? "Loading..." : isSignUp ? "Sign up" : "Log in"}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}
