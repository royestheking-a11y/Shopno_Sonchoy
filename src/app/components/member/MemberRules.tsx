import React, { useState } from 'react';
import { BookOpen, AlertCircle, Clock, Ban, Scale, Book, Shield, Gavel, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../Layout';

const rulesData = [
  {
    icon: Clock,
    en: {
      title: "1. Monthly Savings",
      points: [
        "Each member must submit their monthly savings amount by the 10th of every month.",
        "A 5% penalty will apply if the amount is submitted after the 10th.",
        "Example: For an amount of 1,000 BDT, the penalty is 50 BDT."
      ]
    },
    bn: {
      title: "১. মাসিক সঞ্চয়",
      points: [
        "প্রত্যেক সদস্যকে প্রতি মাসের সঞ্চয়ের টাকা ১০ তারিখের মধ্যে জমা দিতে হবে।",
        "১০ তারিখের পরে টাকা জমা দিলে ৫% জরিমানা প্রযোজ্য হবে।",
        "উদাহরণ: ১,০০০ টাকার ক্ষেত্রে জরিমানা ৫০ টাকা।"
      ]
    }
  },
  {
    icon: FileText,
    en: {
      title: "2. Loan Policy",
      points: [
        "Taking a loan from the association incurs a 5% service charge/interest on the loan amount.",
        "Example: For a 10,000 BDT loan, the service charge is 500 BDT.",
        "Only members of the association are eligible to take loans.",
        "If any member lends money to someone else on their own responsibility, the entire liability of that loan will rest with the respective member."
      ]
    },
    bn: {
      title: "২. ঋণ (লোন) নীতিমালা",
      points: [
        "সমিতি থেকে ঋণ গ্রহণ করলে ঋণের উপর ৫% সার্ভিস চার্জ/ইন্টারেস্ট প্রযোজ্য হবে।",
        "উদাহরণ: ১০,০০০ টাকা ঋণ নিলে সার্ভিস চার্জ ৫০০ টাকা।",
        "শুধুমাত্র সমিতির সদস্যরাই ঋণ গ্রহণ করতে পারবেন।",
        "কোনো সদস্য নিজের দায়িত্বে অন্য কাউকে ঋণ দিলে সেই ঋণের সম্পূর্ণ দায়-দায়িত্ব সংশ্লিষ্ট সদস্যের থাকবে।"
      ]
    }
  },
  {
    icon: AlertCircle,
    en: {
      title: "3. Delays and Gaps",
      points: [
        "If a member faces financial or other issues, they must inform the association in advance.",
        "Not everyone's financial situation is the same, so reasonable causes will be considered compassionately.",
        "Failure to deposit money on time without a valid reason will result in a 5% penalty.",
        "Extended gaps or failure to deposit regularly may result in cancellation of membership."
      ]
    },
    bn: {
      title: "৩. বিলম্ব ও গ্যাপ",
      points: [
        "কোনো সদস্য আর্থিক বা অন্য কোনো সমস্যায় পড়লে অবশ্যই আগে থেকে সমিতিকে জানাতে হবে।",
        "সবার আর্থিক অবস্থা এক নয়, তাই যৌক্তিক কারণ থাকলে বিষয়টি মানবিকভাবে বিবেচনা করা হবে।",
        "যথাযথ কারণ ছাড়া নির্ধারিত সময়ে টাকা জমা না দিলে নিয়ম অনুযায়ী ৫% জরিমানা দিতে হবে।",
        "দীর্ঘ সময় গ্যাপ থাকলে বা নিয়মিত টাকা জমা না দিলে সদস্যপদ বাতিল করা হতে পারে।"
      ]
    }
  },
  {
    icon: Ban,
    en: {
      title: "4. Membership Cancellation & Leaving",
      points: [
        "No member can leave the association at will before completing 3 years.",
        "If leaving is necessary before 3 years, a written or verbal notice must be given at least 2 months in advance.",
        "If a member wishes to break their membership before 3 years, a 10% penalty will be deducted from their total deposited amount.",
        "The remaining amount after deduction will be returned according to the association's rules.",
        "Sudden departure without notice will result in necessary actions decided by the association."
      ]
    },
    bn: {
      title: "৪. সদস্যপদ বাতিল ও সমিতি ত্যাগ",
      points: [
        "কোনো সদস্য ৩ বছর পূর্ণ হওয়ার আগে সমিতি থেকে ইচ্ছামতো বের হতে পারবেন না।",
        "বিশেষ প্রয়োজনে ৩ বছর পূর্ণ হওয়ার আগেই সমিতি ত্যাগ করতে চাইলে কমপক্ষে ২ মাস আগে লিখিত বা মৌখিক নোটিশ দিতে হবে।",
        "৩ বছর পূর্ণ হওয়ার আগে সমিতি ভাঙতে বা সদস্যপদ বাতিল করতে চাইলে, সদস্যের মোট জমাকৃত টাকার উপর ১০% জরিমানা কেটে নেওয়া হবে।",
        "জরিমানা কর্তনের পর অবশিষ্ট টাকা সমিতির নিয়ম অনুযায়ী সদস্যকে ফেরত দেওয়া হবে।",
        "কোনো সদস্য নোটিশ ছাড়া হঠাৎ সমিতি ত্যাগ করলে সমিতির সিদ্ধান্ত অনুযায়ী প্রয়োজনীয় ব্যবস্থা গ্রহণ করা হবে।"
      ]
    }
  },
  {
    icon: Shield,
    en: {
      title: "5. Reasons for Membership Cancellation",
      points: [
        "Failure to deposit money regularly for a long period.",
        "Repeatedly violating the rules of the association.",
        "Engaging in activities against the interests of the association.",
        "Fraud, misconduct, or attempting embezzlement.",
        "Membership can be canceled for any of the above reasons based on a majority decision."
      ]
    },
    bn: {
      title: "৫. সদস্যপদ বাতিলের কারণ",
      points: [
        "দীর্ঘ সময় নিয়মিত টাকা জমা না দিলে।",
        "সমিতির নিয়ম-কানুন বারবার অমান্য করলে।",
        "সমিতির স্বার্থবিরোধী কোনো কাজ করলে।",
        "প্রতারণা, অসদাচরণ বা অর্থ আত্মসাতের চেষ্টা করলে।",
        "উপরোক্ত যেকোনো কারণে সংখ্যাগরিষ্ঠ সদস্যদের সিদ্ধান্তের ভিত্তিতে সদস্যপদ বাতিল করা যাবে।"
      ]
    }
  },
  {
    icon: Gavel,
    en: {
      title: "6. Decision Making",
      points: [
        "All important decisions of the association will be taken based on the members' opinions.",
        "In case of disagreements, decisions will be made through voting.",
        "The decision of the majority vote will be final and binding for all members."
      ]
    },
    bn: {
      title: "৬. সিদ্ধান্ত গ্রহণ",
      points: [
        "সমিতির সকল গুরুত্বপূর্ণ সিদ্ধান্ত সদস্যদের মতামতের ভিত্তিতে নেওয়া হবে।",
        "কোনো বিষয়ে মতভেদ হলে ভোটের মাধ্যমে সিদ্ধান্ত নেওয়া হবে।",
        "মোট সদস্যদের মধ্যে যে পক্ষ অধিক ভোট পাবে, তাদের সিদ্ধান্তই চূড়ান্ত ও সকল সদস্যের জন্য বাধ্যতামূলক হবে।"
      ]
    }
  },
  {
    icon: Book,
    en: {
      title: "7. Accounting",
      points: [
        "All income, expenses, and transactions of the association will be recorded in writing.",
        "Separate accounts will be maintained for each member's deposits, loans, and other transactions.",
        "Any member can view their own account if needed."
      ]
    },
    bn: {
      title: "৭. হিসাব-নিকাশ",
      points: [
        "সমিতির সকল আয়-ব্যয় ও লেনদেন লিখিতভাবে সংরক্ষণ করা হবে।",
        "প্রত্যেক সদস্যের জমা, ঋণ ও অন্যান্য লেনদেনের পৃথক হিসাব রাখা হবে।",
        "প্রয়োজনে যেকোনো সদস্য নিজের হিসাব দেখতে পারবেন।"
      ]
    }
  },
  {
    icon: CheckCircle2,
    en: {
      title: "8. Member Responsibilities",
      points: [
        "Each member must deposit their savings on time.",
        "All rules and regulations of the association must be followed.",
        "All members must play a responsible role in protecting the reputation and interests of the association."
      ]
    },
    bn: {
      title: "৮. সদস্যের দায়িত্ব",
      points: [
        "প্রত্যেক সদস্যকে সময়মতো সঞ্চয়ের টাকা জমা দিতে হবে।",
        "সমিতির সকল নিয়ম-কানুন মেনে চলতে হবে।",
        "সমিতির সুনাম ও স্বার্থ রক্ষায় সকল সদস্য দায়িত্বশীল ভূমিকা পালন করবেন।"
      ]
    }
  },
  {
    icon: Scale,
    en: {
      title: "9. Special Provisions",
      points: [
        "New rules can be added, modified, or repealed with the consent of the members for the needs of the association.",
        "In the event of a member's death or permanent disability, their deposited funds will be given to their legal heir or nominee as decided by the association.",
        "In any unforeseen situation, the decision of the majority of the members will be considered final."
      ]
    },
    bn: {
      title: "৯. বিশেষ বিধান",
      points: [
        "সমিতির প্রয়োজনে সদস্যদের সম্মতিতে নতুন নিয়ম সংযোজন, পরিবর্তন বা বাতিল করা যাবে।",
        "কোনো সদস্য মৃত্যুবরণ করলে বা স্থায়ীভাবে অক্ষম হলে, তার জমাকৃত অর্থ আইনগত উত্তরাধিকারী বা মনোনীত ব্যক্তিকে সমিতির সিদ্ধান্ত অনুযায়ী প্রদান করা হবে।",
        "যেকোনো অনাকাঙ্ক্ষিত পরিস্থিতিতে সমিতির সংখ্যাগরিষ্ঠ সদস্যদের সিদ্ধান্তই চূড়ান্ত বলে গণ্য হবে।"
      ]
    }
  },
  {
    icon: BookOpen,
    en: {
      title: "10. Core Principles",
      points: [
        "The association will be governed on the basis of honesty, transparency, mutual cooperation, discipline, accountability, and trust.",
        "All members will place the interests of the association above their personal interests and will be bound to follow these rules."
      ]
    },
    bn: {
      title: "১০. মূলনীতি",
      points: [
        "সমিতি পরিচালিত হবে সততা, স্বচ্ছতা, পারস্পরিক সহযোগিতা, শৃঙ্খলা, জবাবদিহিতা ও বিশ্বাসের ভিত্তিতে।",
        "সকল সদস্য সমিতির স্বার্থকে ব্যক্তিগত স্বার্থের ঊর্ধ্বে রাখবেন এবং এই নিয়মাবলী মেনে চলতে বাধ্য থাকবেন।"
      ]
    }
  }
];

export function MemberRules() {
  const [lang, setLang] = useState<'en'|'bn'>('bn');

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-premium border border-[#E5E7EB] dark:border-slate-700 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-primary mb-2">
            <BookOpen size={24} className="opacity-80" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সমিতির নিয়মাবলী' : 'Association Rules'}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-xl">
            {lang === 'bn' 
              ? 'আমাদের সমিতির সকল কার্যক্রম সুষ্ঠুভাবে পরিচালনার জন্য নিচে বর্ণিত নিয়মাবলী অনুসরণ করা বাধ্যতামূলক।' 
              : 'To ensure the smooth operation of our association, it is mandatory to follow the rules described below.'}
          </p>
        </div>

        <div className="relative z-10 flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-[#E5E7EB] dark:border-slate-700 shadow-inner">
          <button
            onClick={() => setLang('bn')}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 w-24",
              lang === 'bn' 
                ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-[#E5E7EB] dark:ring-slate-700" 
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            বাংলা
          </button>
          <button
            onClick={() => setLang('en')}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 w-24",
              lang === 'en' 
                ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-[#E5E7EB] dark:ring-slate-700" 
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            English
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rulesData.map((rule, idx) => {
          const content = rule[lang];
          return (
            <div 
              key={idx} 
              className="group bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-premium border border-[#E5E7EB] dark:border-slate-700 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
            >
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="flex items-start gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <rule.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                  {content.title}
                </h3>
              </div>
              <div className="space-y-3 relative z-10 pl-16">
                {content.points.map((point, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 text-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-[#E5E7EB] dark:border-slate-700">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {lang === 'bn' 
            ? 'এই নিয়মাবলী সমিতির সকল সদস্যের কল্যাণের জন্য তৈরি করা হয়েছে। সহযোগিতার জন্য ধন্যবাদ।'
            : 'These rules are created for the welfare of all members of the association. Thank you for your cooperation.'}
        </p>
      </div>
    </div>
  );
}
