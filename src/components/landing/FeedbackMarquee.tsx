// Prints reais de feedback em carrossel contínuo (home e página da aula).

const FEEDBACK_PRINTS = [
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint1.jpeg?alt=media&token=84a37184-0121-45af-93ca-a017124e91e2",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint10.jpeg?alt=media&token=fc755d1d-39df-4c4d-9613-6be8f7009433",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint11.jpeg?alt=media&token=c05cb365-b451-48de-98a5-85520ebf0283",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint12.jpeg?alt=media&token=a78632e2-2ffd-4312-acc4-d333d44c58b7",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint13.jpeg?alt=media&token=6d9abd66-75c2-45e9-9f2b-902f30752b5f",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint14.jpeg?alt=media&token=ed7a1b73-3258-4031-8eeb-bb25718f0cb6",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint15.jpeg?alt=media&token=f5d6983a-3fb0-41d0-b969-b2ef635c40e0",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint16.jpeg?alt=media&token=672201d1-d6e9-4e7d-a9f5-e4e40d5ea853",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint17.jpeg?alt=media&token=70dd18c0-0dc3-4dea-83af-9f9301d7582a",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint18.jpeg?alt=media&token=d81f23ec-20f0-421c-af5c-263556ccad3d",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint2.jpeg?alt=media&token=d63ae003-533c-4e74-9e30-c16a51742ef0",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint3.jpeg?alt=media&token=faf8d697-e0d9-4ec3-a869-666aa77dd09a",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint4.jpeg?alt=media&token=15673ef5-df6f-44a3-9d42-984f7d6a7dfe",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint5.jpeg?alt=media&token=fe4d00e4-94f7-4e30-88a7-e9e75b566761",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint6.jpeg?alt=media&token=3ea761d0-0877-4f9f-89d9-6ff255ddd246",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint7.jpeg?alt=media&token=adc53f02-08a2-4c99-87c7-531375c5c3cc",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint8.jpeg?alt=media&token=fb28488e-7c54-4ea4-9b08-0cecee11fc1f",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint9.jpeg?alt=media&token=1eafdc48-4cb0-4337-8d48-7443b19358ef",
  "https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/feedbacks%20prints%2Fprint%2019.jpeg?alt=media&token=c10f71cd-02dc-4f49-b7ba-ae8712b0ca05"
];

export function FeedbackMarquee() {
  return (
    <div className="relative w-full flex overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-16 before:bg-gradient-to-r before:from-[#050505] before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-16 after:bg-gradient-to-l after:from-[#050505] after:to-transparent">
      <style>{`
        @keyframes slide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-slide { animation: slide 50s linear infinite; }
        .animate-slide:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .animate-slide { animation: none; } }
      `}</style>
      <div className="flex animate-slide gap-5 w-max px-4">
        {[...FEEDBACK_PRINTS, ...FEEDBACK_PRINTS].map((src, index) => (
          <div key={index} className="w-[200px] h-[320px] sm:w-[240px] sm:h-[380px] flex-shrink-0 relative group rounded-3xl overflow-hidden border border-white/[0.07] bg-white/[0.03] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Feedback ${(index % FEEDBACK_PRINTS.length) + 1}`} className="w-full h-full object-contain rounded-2xl transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
