export function RoleBadge({ name }: { name: string }) {
  return (
    <span className="w-fit rounded-[3px] bg-orange-500 px-1.5 py-0.75 font-mono text-[0.5625rem] leading-none tracking-[0.16em] text-navy-950 uppercase">
      {name}
    </span>
  );
}
