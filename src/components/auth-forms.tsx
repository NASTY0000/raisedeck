"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { loginAction, registerAction } from "@/lib/actions";
import { Logo } from "./ui";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rd-btn-primary w-full py-2.5">
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function LoginForm({
  inviteToken,
  email,
}: {
  inviteToken?: string;
  email?: string;
}) {
  const [state, action] = useFormState(loginAction, undefined);
  return (
    <AuthCard
      title="Sign in"
      subtitle="Founders land in the raise workspace. Investors land on invited dealflow."
    >
      <form action={action} className="space-y-3">
        {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}
        <Field label="Email" name="email" type="email" defaultValue={email} required />
        <Field label="Password" name="password" type="password" required />
        {state?.error ? <p className="text-sm text-rose-400">{state.error}</p> : null}
        <Submit>Sign in</Submit>
      </form>
      <p className="mt-4 text-xs text-zinc-500">
        Demo founder <code className="text-zinc-300">ada@raisedeck.demo</code> · investor{" "}
        <code className="text-zinc-300">amara@raisedeck.demo</code> · password{" "}
        <code className="text-zinc-300">demo1234</code>
      </p>
      <p className="mt-3 text-sm text-zinc-500">
        No account?{" "}
        <Link href={inviteToken ? `/register?invite=${inviteToken}` : "/register"} className="text-accent-300">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}

export function RegisterForm({
  inviteToken,
  email,
  role = "FOUNDER",
}: {
  inviteToken?: string;
  email?: string;
  role?: string;
}) {
  const [state, action] = useFormState(registerAction, undefined);
  const lockedRole = Boolean(inviteToken) ? "INVESTOR" : role;
  return (
    <AuthCard title="Create account" subtitle="One workspace. Two roles. Invite-only deals.">
      <form action={action} className="space-y-3">
        {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}
        <Field label="Full name" name="name" required />
        <Field label="Email" name="email" type="email" defaultValue={email} required />
        <Field label="Password" name="password" type="password" required />
        <div>
          <label className="rd-label">Role</label>
          <select name="role" defaultValue={lockedRole} className="rd-input" disabled={Boolean(inviteToken)}>
            <option value="FOUNDER">Founder — I&apos;m raising</option>
            <option value="INVESTOR">Investor — I see invited deals</option>
          </select>
          {inviteToken ? <input type="hidden" name="role" value="INVESTOR" /> : null}
        </div>
        {lockedRole === "FOUNDER" ? (
          <Field label="Company name" name="companyName" placeholder="Acme Labs" />
        ) : (
          <Field label="Firm name" name="firmName" placeholder="Optional" />
        )}
        {state?.error ? <p className="text-sm text-rose-400">{state.error}</p> : null}
        <Submit>Create account</Submit>
      </form>
      <p className="mt-4 text-sm text-zinc-500">
        Already on RaiseDeck?{" "}
        <Link href={inviteToken ? `/login?invite=${inviteToken}` : "/login"} className="text-accent-300">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="rd-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="rd-input"
      />
    </div>
  );
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <LinkHome />
        <div className="rd-card mt-6 p-6">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function LinkHome() {
  return (
    <a href="/" className="inline-block">
      <Logo />
    </a>
  );
}
