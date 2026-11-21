import type { Member } from '../types'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

export function Avatar({ member, size = 22 }: { member: Member; size?: number }) {
  return (
    <span
      title={member.name}
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-[#fff] ring-2 ring-white select-none tracking-tight"
      style={{ backgroundColor: member.color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(member.name)}
    </span>
  )
}

export function AvatarStack({ members, max = 3, size = 22 }: { members: Member[]; max?: number; size?: number }) {
  if (members.length === 0) return null
  const extra = members.length - max
  return (
    <span className="flex -space-x-0.5">
      {members.slice(0, max).map((m) => (
        <Avatar key={m.id} member={m} size={size} />
      ))}
      {extra > 0 && (
        <span
          className="inline-grid place-items-center rounded-full bg-slate-200 font-semibold text-slate-600 ring-2 ring-white"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}

export function LabelChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  )
}
