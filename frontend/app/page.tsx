import { useEffect } from 'react'
import React from 'react'
import Link from 'next/link'

const perks = [
  {
    title: 'Admins create jobs',
    description: 'Configure prompts, fields, and assign member emails in minutes.',
  },
  {
    title: 'Members complete tasks',
    description:
      'Assigned users log in with their email, upload PDFs, and submit extracted data.',
  },
  {
    title: 'Live progress tracking',
    description:
      'Monitor extraction status, download structured results, and receive notifications.',
  },
]

export default function Home() {
    return (
      <div className="min-h-screen bg-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-16 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              SaaS PDF Intelligence
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Transform messy PDFs into actionable, structured data.
            </h1>
            <p className="text-lg text-slate-600">
              Admins spin up extraction jobs with tailored prompts. Members—using the emails
              assigned by admins—log in, upload files, and finish the workflow. One secure hub
              for both roles.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/member/login"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-700 transition"
              >
                Member Login
              </Link>
              <Link
                href="/admin/register"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-slate-800 font-semibold hover:bg-white/70 transition"
              >
                Admin Portal
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              Members must sign in with the exact email the admin assigned while creating the job.
              Passwords are set during the first login.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">How it works</h2>
            <div className="space-y-6">
              {perks.map((perk) => (
                <div key={perk.title} className="flex gap-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 font-semibold">
                    {perks.indexOf(perk) + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{perk.title}</h3>
                    <p className="text-sm text-slate-600">{perk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
}