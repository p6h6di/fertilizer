import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#d97706",
            colorBackground: "#fffbeb",
            colorText: "#451a03",
            colorInputBackground: "#fff7ed",
            colorInputText: "#451a03",
            borderRadius: "0.5rem",
          },
          elements: {
            card: "shadow-lg border border-amber-200",
            headerTitle: "text-amber-900",
            headerSubtitle: "text-amber-700",
            socialButtonsBlockButton: "border-amber-200 hover:bg-amber-50",
            formButtonPrimary: "bg-amber-600 hover:bg-amber-700",
            footerActionLink: "text-amber-600 hover:text-amber-700",
          },
        }}
      />
    </div>
  );
}
