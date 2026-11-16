import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhonemeString(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function isPhonemeAnswerCorrect(
  chosenLetter: string,
  targetLetter: string
): boolean {
  const normalizedChosen = normalizePhonemeString(chosenLetter)
  const normalizedTarget = normalizePhonemeString(targetLetter)
  if (!normalizedChosen || !normalizedTarget) return false
  return normalizedChosen === normalizedTarget
}

