"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Download, Loader2, RotateCcw } from "lucide-react"

const SUPPORTED_INPUT_FORMATS = [".txt", ".pdf", ".doc", ".docx", ".rtf", ".asc", ".wps", ".wpd", ".msg"]
const SUPPORTED_OUTPUT_FORMATS = [".pdf", ".txt"]

interface ConversionResult {
  blob: Blob
  filename: string
}

export default function DocumentConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [outputFormat, setOutputFormat] = useState<string>("")
  const [isConverting, setIsConverting] = useState(false)
  const [convertedFile, setConvertedFile] = useState<ConversionResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
      if (SUPPORTED_INPUT_FORMATS.includes(fileExtension)) {
        setSelectedFile(file)
        setConvertedFile(null)
        toast({
          title: "File Selected",
          description: `${file.name} ready for conversion`,
        })
      } else {
        toast({
          title: "Unsupported Format",
          description: "Please select a supported file format",
          variant: "destructive",
        })
      }
    }
  }

  const convertToTxt = async (file: File): Promise<string> => {
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (fileExtension === ".txt") {
      return await file.text()
    }

    // For other formats, extract text content (simplified simulation)
    const content = `Document: ${file.name}
Converted from: ${fileExtension.toUpperCase()}
Conversion Date: ${new Date().toLocaleString()}
File Size: ${(file.size / 1024).toFixed(2)} KB

--- EXTRACTED CONTENT ---

This is a simulated text extraction from your ${fileExtension.toUpperCase()} document.
In a real implementation, this would contain the actual extracted text content
from your document while preserving the basic structure and readability.

The Magical Document Converter processes your files locally for privacy
and security, ensuring your documents never leave your device.

--- END OF CONTENT ---`

    return content
  }

  const convertToPdf = async (file: File): Promise<string> => {
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    // Simulate PDF conversion with structured content
    const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(Document Converted by Magical Document Converter) Tj
0 -20 Td
(Original File: ${file.name}) Tj
0 -20 Td
(Source Format: ${fileExtension.toUpperCase()}) Tj
0 -20 Td
(Converted: ${new Date().toLocaleString()}) Tj
0 -40 Td
(This is a simulated PDF conversion.) Tj
0 -20 Td
(Your content would appear here with proper formatting.) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
456
%%EOF`

    return content
  }

  const performConversion = async (file: File, targetFormat: string): Promise<ConversionResult> => {
    let content: string
    let mimeType: string

    if (targetFormat === ".txt") {
      content = await convertToTxt(file)
      mimeType = "text/plain"
    } else if (targetFormat === ".pdf") {
      content = await convertToPdf(file)
      mimeType = "application/pdf"
    } else {
      throw new Error("Unsupported output format")
    }

    const blob = new Blob([content], { type: mimeType })
    const filename = `${file.name.split(".")[0]}_converted${targetFormat}`

    return { blob, filename }
  }

  const handleConvert = async () => {
    if (!selectedFile || !outputFormat) {
      toast({
        title: "Missing Information",
        description: "Please select a file and output format",
        variant: "destructive",
      })
      return
    }

    setIsConverting(true)

    try {
      toast({
        title: "Converting...",
        description: "Processing your document",
      })

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const result = await performConversion(selectedFile, outputFormat)
      setConvertedFile(result)

      toast({
        title: "Conversion Complete",
        description: "Your document has been converted successfully",
      })
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: "An error occurred during conversion",
        variant: "destructive",
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleDownload = () => {
    if (convertedFile) {
      const url = URL.createObjectURL(convertedFile.blob)
      const link = document.createElement("a")
      link.href = url
      link.download = convertedFile.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: "Your converted file is being saved",
      })
    }
  }

  const resetConverter = () => {
    setSelectedFile(null)
    setOutputFormat("")
    setConvertedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "url(/wallpaper.jpg)" }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/30" />

      <Card className="w-full max-w-sm relative z-10 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Document Converter</h1>
              <p className="text-sm text-gray-600">Convert documents effortlessly</p>
            </div>
          </div>

          {/* File Selection */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_INPUT_FORMATS.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-14 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 text-left justify-start"
            >
              <Upload className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {selectedFile ? (
                  <div>
                    <div className="font-medium truncate">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
                  </div>
                ) : (
                  <span>Select Document</span>
                )}
              </div>
            </Button>
          </div>

          {/* Output Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Convert to:</label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choose output format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=".pdf">PDF Document</SelectItem>
                <SelectItem value=".txt">Plain Text</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleConvert}
              disabled={!selectedFile || !outputFormat || isConverting}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                "Convert Document"
              )}
            </Button>

            {convertedFile && (
              <Button
                onClick={handleDownload}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Download {convertedFile.filename}
              </Button>
            )}

            {(selectedFile || convertedFile) && (
              <Button
                onClick={resetConverter}
                variant="ghost"
                className="w-full h-10 text-gray-600 hover:text-gray-800"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>

          {/* Supported Formats */}
          <div className="text-center pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Supported formats:</p>
            <p className="text-xs text-gray-400 leading-relaxed">{SUPPORTED_INPUT_FORMATS.join(" • ").toUpperCase()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
