"use client"

import Image from "next/image"
import { useState } from "react"
import Tesseract, { createWorker } from "tesseract.js"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handlePassportInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputPassportImg = e.target.files?.[0] ?? null
    // console.log(inputPassportImg)

    setFile(inputPassportImg)
    setRawData("")
    setError(null)
  }

  async function handleOCR() {
    if (!file) {
      setError("Please upload a image first")
      return
    }

    setLoading(true)
    setError(null)
    setRawData("")

    try {
      const getFileURL = URL.createObjectURL(file)

      const worker = await createWorker("eng")
      const imgData = await worker.recognize(getFileURL)

      // console.log(imgData.data.text)

      setRawData(imgData.data.text)

      console.log("RMZ text found", findRmzText(rawData))
    } catch (err) {
      const errored = err as Error
      console.error(errored.message)
      setError("Failed to read the text from the image")
    } finally {
      setLoading(false)
    }
  }

  function findRmzText(text: string): string | null {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const candidate = lines.filter(
      (line) => line.length > 0 && line.includes("<")
    )

    if (candidate.length >= 2) {
      return candidate.slice(-2).join("\n")
    }

    return null
  }

  return (
    <main>
      <h1>Passport OCR</h1>

      <section>
        <div>
          <label htmlFor="passportImg">
            <input
              id="passportImg"
              type="file"
              onChange={handlePassportInput}
              name="userPassport"
              accept="image/*"
            />
          </label>
          <button
            className={`
              cursor-pointer
              disabled:cursor-not-allowed disabled:opacity-50
            `}
            disabled={loading || !file}
            onClick={handleOCR}
          >
            {loading ? "Reading..." : "Run OCR"}
          </button>
        </div>
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
        <div>
          {error && <p style={{ color: "red" }}>{error}</p>}

          {rawData && (
            <div>
              <h2>Raw OCR Text</h2>
              <pre>{rawData}</pre>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
