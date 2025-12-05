"use client"

import Image from "next/image"
import { useState } from "react"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)

  const handlePassportInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputPassportImg = e.target.files?.[0] ?? null
    console.log(inputPassportImg)

    setFile(inputPassportImg)
  }

  return (
    <main>
      <h1>Passport OCR</h1>

      <section>
        <label htmlFor="passportImg">
          <input
            id="passportImg"
            type="file"
            onChange={handlePassportInput}
            name="userPassport"
            accept="image/*"
          />
        </label>
        <div>
          {file ? (
            <p>
              Selected file name: <strong>{file.name}</strong> and size of the
              image {(file.size / 1024).toFixed(2)}
            </p>
          ) : (
            <p>Please add a image of the passport</p>
          )}
        </div>
      </section>
    </main>
  )
}
