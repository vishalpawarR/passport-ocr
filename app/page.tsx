"use client"

import Image from "next/image"
import { useState } from "react"
import Tesseract, { createWorker } from "tesseract.js"
import { parse as parseMrz, MrzResult } from "mrz"

interface PassportForm {
  firstName: string
  lastName: string
  passportNumber: string
  dob: string
  expiryDate: string
  nationality: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<PassportForm>({
    firstName: "",
    lastName: "",
    passportNumber: "",
    dob: "",
    expiryDate: "",
    nationality: "",
  })

  const handlePassportInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputPassportImg = e.target.files?.[0] ?? null
    // console.log(inputPassportImg)

    setFile(inputPassportImg)
    setRawData("")
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
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

      const text = imgData.data.text

      setRawData(text)

      const mrz = findMrzText(text)

      console.log("mrz", mrz)

      if (!mrz) {
        setError(
          "Could not detect MRZ. Try a clearer, straight passport image."
        )
        return
      }

      const parsed: MrzResult = parseMrz(mrz)

      const fields = parsed.fields

      console.log(fields)

      setForm((prev) => ({
        ...prev,
        firstName: fields.firstName ?? prev.firstName,
        lastName: fields.surname ?? prev.lastName,
        passportNumber: fields.documentNumber ?? prev.passportNumber,
        dob: fields.birthDate ?? prev.dob,
        expiryDate: fields.expiryDate ?? prev.expiryDate,
        nationality: fields.country ?? prev.nationality,
      }))
    } catch (err) {
      const errored = err as Error
      console.error(errored.message)
      setError("Failed to read the text from the image")
    } finally {
      setLoading(false)
    }
  }

  function findMrzText(text: string): string | null {
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

          {/* {rawData && (
            <div>
              <h2>Raw OCR Text</h2>
              <pre>{rawData}</pre>
            </div>
          )} */}
        </div>

        <div>
          {/* 1 */}
          <label>
            First Name
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleInputChange}
            />
          </label>

          {/* 2 */}
          <label>
            Last Name
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleInputChange}
            />
          </label>

          {/* 3 */}
          <label>
            Passport Number
            <input
              name="passportNumber"
              value={form.passportNumber}
              onChange={handleInputChange}
            />
          </label>

          {/* 4 */}
          <label>
            Date of Birth
            <input
              name="dob"
              value={form.dob}
              onChange={handleInputChange}
            />
          </label>

          {/* 5 */}
          <label>
            Expiry Date
            <input
              name="expiryDate"
              value={form.expiryDate}
              onChange={handleInputChange}
            />
          </label>

          {/* 6 */}
          <label>
            Nationality
            <input
              name="nationality"
              value={form.nationality}
              onChange={handleInputChange}
            />
          </label>
        </div>
      </section>
    </main>
  )
}
