"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Download, Loader2 } from "lucide-react"

const SUPPORTED_INPUT_FORMATS = [".txt", ".pdf", ".doc", ".docx", ".rtf", ".asc", ".wps", ".wpd", ".msg"]
const SUPPORTED_OUTPUT_FORMATS = [".pdf", ".txt"]

export default function DocumentConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [outputFormat, setOutputFormat] = useState<string>("")
  const [isConverting, setIsConverting] = useState(false)
  const [convertedFile, setConvertedFile] = useState<string | null>(null)
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
          title: "File selected",
          description: `${file.name} is ready for conversion`,
        })
      } else {
        toast({
          title: "Unsupported format",
          description: "Please select a supported file format",
          variant: "destructive",
        })
      }
    }
  }

  const simulateConversion = async (file: File, targetFormat: string): Promise<string> => {
    // Simulate conversion process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const fileName = file.name.split(".")[0]
    const convertedFileName = `${fileName}_converted${targetFormat}`

    // Create a simple converted file (simulation)
    let content = ""
    if (targetFormat === ".txt") {
      content = `Converted content from ${file.name}\n\nThis is a simulated conversion to plain text format.\nOriginal file: ${file.name}\nConverted on: ${new Date().toLocaleString()}`
    } else if (targetFormat === ".pdf") {
      content = `PDF conversion simulation for ${file.name}`
    }

    const blob = new Blob([content], { type: targetFormat === ".txt" ? "text/plain" : "application/pdf" })
    return URL.createObjectURL(blob)
  }

  const handleConvert = async () => {
    if (!selectedFile || !outputFormat) {
      toast({
        title: "Missing information",
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

      const convertedFileUrl = await simulateConversion(selectedFile, outputFormat)
      setConvertedFile(convertedFileUrl)

      toast({
        title: "Conversion complete",
        description: "Your document has been converted successfully",
      })
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: "An error occurred during conversion",
        variant: "destructive",
      })
    } finally {
      setIsConverting(false)
    }
  }

  const handleDownload = () => {
    if (convertedFile && selectedFile) {
      const fileName = selectedFile.name.split(".")[0]
      const link = document.createElement("a")
      link.href = convertedFile
      link.download = `${fileName}_converted${outputFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download started",
        description: "Your converted file is being downloaded",
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

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "url(/wallpaper.jpg)" }}
    >
      <div className="absolute inset-0 bg-black/20" />

      <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 mx-auto text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Document Converter</h1>
            <p className="text-sm text-gray-600">Convert documents effortlessly</p>
          </div>

          <div className="space-y-4">
            {/* File Selection */}
            <div className="space-y-2">
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
                className="w-full h-12 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? selectedFile.name : "Select Document"}
              </Button>
              {selectedFile && (
                <p className="text-xs text-gray-500 text-center">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
              )}
            </div>

            {/* Output Format Selection */}
            <div className="space-y-2">
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose output format" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_OUTPUT_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format.toUpperCase()} Format
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Convert Button */}
            <Button
              onClick={handleConvert}
              disabled={!selectedFile || !outputFormat || isConverting}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
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

            {/* Download Button */}
            {convertedFile && (
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full h-12 border-green-500 text-green-700 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Converted File
              </Button>
            )}

            {/* Reset Button */}
            {(selectedFile || convertedFile) && (
              <Button onClick={resetConverter} variant="ghost" className="w-full text-gray-500 hover:text-gray-700">
                Start Over
              </Button>
            )}
          </div>

          {/* Supported Formats Info */}
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-500">Supported input formats:</p>
            <p className="text-xs text-gray-400">{SUPPORTED_INPUT_FORMATS.join(", ").toUpperCase()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
