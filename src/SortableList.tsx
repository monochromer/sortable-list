import React, { useState, useEffect } from 'react'

enum Position {
  before = 0,
  after
}

export type Direction = 'vertical' | 'horizontal'

export interface SortableItemProps<T> {
  item: T
  isDragItemInsertBefore: boolean
  isDragItemInsertAfter: boolean
  isDragged: boolean
  isHovered: boolean
}

export interface SortableListProps<T> {
  items: T[]
  direction?: Direction
  className?: string
  style?: React.CSSProperties
  children: (props: SortableItemProps<T>, index: number) => React.ReactElement
  onSort: (sourceIndex: number, targetIndex: number) => void
  computeKey: (item: T) => React.Key
}

const shouldInsertBefore = (sourceIndex: number | null, targetIndex: number | null, index: number) => {
  if (sourceIndex == null || targetIndex == null) {
    return false
  }
  if (targetIndex >= sourceIndex) {
    return targetIndex === index - 1
  }
  return targetIndex === index
}

const shouldInsertAfter = (sourceIndex: number | null, targetIndex: number | null, index: number) => {
  if (sourceIndex == null || targetIndex == null) {
    return false
  }
  if (targetIndex > sourceIndex) {
    return targetIndex === index
  }
  return targetIndex === index + 1
}

function useDragPreventAnimation(sourceIndex: number | null) {
  useEffect(() => {
    const handler = (e: DragEvent) => {
      if (sourceIndex !== null) {
        e.preventDefault()
      }
    }

    document.addEventListener('dragover', handler)

    return () => {
      document.removeEventListener('dragover', handler)
    }

  }, [sourceIndex])
}

function calculateInsertPosition(e: React.DragEvent<HTMLDivElement>, direction: Direction) : Position {
  const { top, left, width, height } = e.currentTarget.getBoundingClientRect()

  if (direction === 'vertical') {
    return e.clientY < top + height / 2 ? Position.before : Position.after
  }

  return e.clientX < left + width / 2 ? Position.before : Position.after
}

function calculationTargetIndex(position: Position, sourceIndex: number, index: number): number {
  if (sourceIndex === index) {
    return index
  }

  if (sourceIndex < index) {
    if (position === Position.before) {
      return Math.max(0, index - 1)
    }

    return index
  }

  if (position === Position.before) {
    return index
  }

  return index + 1
}

export function SortableList<T>(props: SortableListProps<T>) {
  const [sourceIndex, setSourceIndex] = useState<number | null>(null)
  const [hoveredItem, setHoveredItem] = useState<number| null>(null)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)

  const { items, direction = 'vertical', className, style, onSort, computeKey } = props

  useDragPreventAnimation(sourceIndex)

  return (
    <div className={className} style={style}>
      {items.map((item, index) =>
        <div
          draggable
          key={computeKey ? computeKey(item) : index}
          onDragStart={() => setSourceIndex(index)}
          onDragEnter={() => setHoveredItem(index)}
          onDragOver={(e) => {
            e.preventDefault()

            if (sourceIndex === null) {
              return
            }

            const position = calculateInsertPosition(e, direction)
            const targetIndex = calculationTargetIndex(position, sourceIndex, index)

            setTargetIndex(targetIndex)
          }}
          onDragEnd={(e) => {
            e.preventDefault()

            if (sourceIndex !== null && targetIndex !== null) {
              onSort(sourceIndex, targetIndex)
            }

            setTargetIndex(null)
            setSourceIndex(null)
            setHoveredItem(null)
          }}
        >
          {props.children({
            item,
            isDragItemInsertBefore: shouldInsertBefore(sourceIndex, targetIndex, index),
            isDragItemInsertAfter: shouldInsertAfter(sourceIndex, targetIndex, index),
            isDragged: sourceIndex === index,
            isHovered: hoveredItem === index
          }, index)}
        </div>
      )}
    </div>
  )
}
