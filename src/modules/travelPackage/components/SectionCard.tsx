import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type SectionCardProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    children: ReactNode;
};

const SectionCard = ({
    icon: Icon,
    title,
    description,
    children,
}: SectionCardProps) => (
    <section className="p-4 lg:p-5">
        <header className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-50 border border-slate-100">
                <Icon className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {title}
                </h2>
                <p className="text-[11px] text-slate-500 leading-tight">
                    {description}
                </p>
            </div>
        </header>
        {children}
    </section>
);

export default SectionCard;
