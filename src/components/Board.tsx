import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { COLUMNS, isStatus } from '../types'
import type { Status, Task } from '../types'
import { Column } from './Column'
import { TaskCardView } from './TaskCard'

interface Props {
  tasks: Task[]
  onMove: (id: string, status: Status, position: number) => void
  onCreate: (status: Status, title: string) => Promise<boolean>
  onOpen: (id: string) => void
  onAddClick: (status: Status) => void
}

const GAP = 1000

export function Board({ tasks, onMove, onCreate, onOpen, onAddClick }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<Status | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), // small move needed, so clicks still work
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }), // long-press on phones
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }), // accessibility
  )

  // group tasks into columns, sorted by position
  const byStatus = useMemo(() => {
    const map: Record<Status, Task[]> = { todo: [], in_progress: [], in_review: [], done: [] }
    for (const t of [...tasks].sort((a, b) => a.position - b.position)) map[t.status].push(t)
    return map
  }, [tasks])

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null

  // "over" can be a column id or another task's id, so find which column it is
  const statusOf = (id: string): Status | undefined =>
    isStatus(id) ? id : tasks.find((t) => t.id === id)?.status

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id))
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverStatus(over ? statusOf(String(over.id)) ?? null : null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    setOverStatus(null)
    if (!over) return

    const task = tasks.find((t) => t.id === active.id)
    const overId = String(over.id)
    const target = statusOf(overId)
    if (!task || !target) return

    let list = byStatus[target]
    let newIndex: number

    if (target === task.status) {
      // reorder inside the same column
      const oldIndex = list.findIndex((t) => t.id === task.id)
      newIndex = isStatus(overId) ? list.length - 1 : list.findIndex((t) => t.id === overId)
      if (oldIndex === newIndex) return
      list = arrayMove(list, oldIndex, newIndex)
    } else {
      // move into another column, before the card we dropped on (or at the end)
      newIndex = isStatus(overId) ? list.length : list.findIndex((t) => t.id === overId)
      list = [...list.slice(0, newIndex), task, ...list.slice(newIndex)]
    }

    // new position = halfway between the neighbours, so only ONE row needs updating
    const prev = list[newIndex - 1]
    const next = list[newIndex + 1]
    const position =
      prev && next ? (prev.position + next.position) / 2
      : prev ? prev.position + GAP
      : next ? next.position - GAP
      : GAP

    onMove(task.id, target, position)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null)
        setOverStatus(null)
      }}
    >
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:snap-none">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={byStatus[col.id]}
            highlighted={activeTask !== null && overStatus === col.id && activeTask.status !== col.id}
            onCreate={onCreate}
            onOpen={onOpen}
            onAddClick={onAddClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeTask ? <TaskCardView task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
