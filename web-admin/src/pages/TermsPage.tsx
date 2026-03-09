import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";

export function TermsPage() {
  return (
    <>
      <PublicHeader />
      <main className="legal-page">
        <section className="legal-card">
          <h1>টার্মস ও কন্ডিশনস</h1>
          <p>সর্বশেষ আপডেট: ৯ মার্চ, ২০২৬</p>

          <h2>১. সেবার পরিধি</h2>
          <p>
            BloodPoint রক্তদাতা ও রক্তগ্রহীতার মধ্যে সংযোগ তৈরি করে। এটি চিকিৎসকের পরামর্শ, জরুরি সেবা বা
            হাসপাতালের নিয়মের বিকল্প নয়।
          </p>

          <h2>২. ব্যবহারকারীর দায়িত্ব</h2>
          <p>
            ব্যবহারকারীকে সঠিক তথ্য দিতে হবে, আইনসম্মতভাবে প্ল্যাটফর্ম ব্যবহার করতে হবে এবং অপব্যবহার, প্রতারণা,
            হয়রানি বা স্প্যাম থেকে বিরত থাকতে হবে।
          </p>

          <h2>৩. মডারেশন ও প্রয়োগ</h2>
          <p>
            BloodPoint রিপোর্ট পর্যালোচনা, ক্ষতিকর কনটেন্ট অপসারণ/হাইড এবং কমিউনিটি নীতিমালা ভঙ্গকারী
            অ্যাকাউন্ট সীমাবদ্ধ করার অধিকার সংরক্ষণ করে।
          </p>

          <h2>৪. সেবার প্রাপ্যতা</h2>
          <p>
            মেইনটেন্যান্স, নেটওয়ার্ক সমস্যা বা তৃতীয় পক্ষের সার্ভিসের ওপর নির্ভরতার কারণে সেবার প্রাপ্যতা পরিবর্তিত
            হতে পারে।
          </p>

          <h2>৫. দায়বদ্ধতা</h2>
          <p>
            BloodPoint best-effort ভিত্তিতে সেবা দেয়। চূড়ান্ত চিকিৎসা বা জরুরি সিদ্ধান্তের দায় ব্যবহারকারীর
            নিজস্ব।
          </p>

          <div className="legal-actions">
            <Link className="btn" to="/">
              হোমে ফিরুন
            </Link>
            <Link className="btn" to="/privacy-policy">
              প্রাইভেসি পলিসি দেখুন
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
