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

  function normalizeMrzLine(raw: string): string {
    let cleaned = raw.toUpperCase()

    cleaned = cleaned.replace(/[^A-Z0-9<]/g, "<")

    cleaned = cleaned.replace(/[KL]/g, "<")

    cleaned = cleaned.replace(/\s+/g, "")

    if (cleaned.length > 44) {
      cleaned = cleaned.slice(0, 44)
    } else if (cleaned.length < 44) {
      cleaned = cleaned.padEnd(44, "<")
    }

    return cleaned
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
      const lastTwo = candidate.slice(-2)
      const line1 = normalizeMrzLine(lastTwo[0])
      const line2 = normalizeMrzLine(lastTwo[1])

      console.log("MRZ raw lines:", lastTwo)
      console.log("MRZ normalized:", line1, line2)

      return `${line1}\n${line2}`
    }

    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Passport OCR
          </h1>
          <p className="text-gray-600">
            Upload your passport image to automatically extract information
          </p>
        </div>

        {file && <Image src="" />}

        <section className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <label
                htmlFor="passportImg"
                className="flex-1 cursor-pointer"
              >
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-indigo-500 transition-colors duration-200 text-center">
                  <input
                    id="passportImg"
                    type="file"
                    onChange={handlePassportInput}
                    name="userPassport"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </label>

              <button
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={loading || !file}
                onClick={handleOCR}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Reading...
                  </span>
                ) : (
                  "Run OCR"
                )}
              </button>
            </div>

            {/* File Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              {file ? (
                <p className="text-sm text-gray-700">
                  Selected file:{" "}
                  <strong className="text-gray-900">{file.name}</strong>
                  <span className="text-gray-500 ml-2">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  No file selected. Please upload a passport image.
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-400 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Extracted Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleInputChange}
                  className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleInputChange}
                  className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter last name"
                />
              </div>

              {/* Passport Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passport Number
                </label>
                <input
                  name="passportNumber"
                  value={form.passportNumber}
                  onChange={handleInputChange}
                  className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter passport number"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  name="dob"
                  value={form.dob}
                  onChange={handleInputChange}
                  className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="YYMMDD"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleInputChange}
                  className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="YYMMDD"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  name="nationality"
                  value={form.nationality}
                  onChange={handleInputChange}
                  className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Country code"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
