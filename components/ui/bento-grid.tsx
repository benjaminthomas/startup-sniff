import { cn } from "@/lib/utils";
import React from "react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid auto-rows-[16rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-sm p-4 bg-card border border-border/40 hover:border-primary/30 flex flex-col h-full overflow-hidden [transform-style:preserve-3d] hover:[transform:perspective(1000px)_rotateX(5deg)_rotateY(5deg)] hover:scale-[1.02]",
        className
      )}
    >
      <div className="flex-shrink-0 mb-3 [transform:translateZ(50px)]">
        {header}
      </div>
      <div className="group-hover/bento:translate-x-1 transition duration-200 flex-1 flex flex-col min-h-0 [transform:translateZ(75px)]">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <div className="font-semibold text-foreground text-lg truncate">
            {title}
          </div>
        </div>
        <div className="font-normal text-muted-foreground text-sm leading-relaxed flex-1 overflow-hidden">
          <div className="line-clamp-3">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};