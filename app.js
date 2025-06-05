class DocumentConverter {
  constructor() {
    this.selectedFile = null
    this.convertedFile = null
    this.isConverting = false
    this.supportedInputFormats = [".txt", ".pdf", ".doc", ".docx", ".rtf", ".asc", ".wps", ".wpd", ".msg"]
    this.supportedOutputFormats = [".pdf", ".txt"]

    this.initializeElements()
    this.bindEvents()
    this.lucide = window.lucide // Declare the lucide variable
    this.RTF = window.RTF // Declare the RTF variable
    this.pdfjsLib = window.pdfjsLib // Declare the pdfjsLib variable
    this.mammoth = window.mammoth // Declare the mammoth variable
  }

  initializeElements() {
    this.fileInput = document.getElementById("fileInput")
    this.selectFileBtn = document.getElementById("selectFileBtn")
    this.fileText = document.getElementById("fileText")
    this.fileSize = document.getElementById("fileSize")
    this.outputFormat = document.getElementById("outputFormat")
    this.convertBtn = document.getElementById("convertBtn")
    this.downloadBtn = document.getElementById("downloadBtn")
    this.resetBtn = document.getElementById("resetBtn")
    this.toastContainer = document.getElementById("toastContainer")
    this.progressContainer = document.getElementById("progressContainer")
    this.progressBar = document.getElementById("progressBar")
    this.progressPercent = document.getElementById("progressPercent")
  }

  bindEvents() {
    this.selectFileBtn.addEventListener("click", () => this.fileInput.click())
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e))
    this.outputFormat.addEventListener("change", () => this.updateConvertButton())
    this.convertBtn.addEventListener("click", () => this.handleConvert())
    this.downloadBtn.addEventListener("click", () => this.handleDownload())
    this.resetBtn.addEventListener("click", () => this.resetConverter())
  }

  handleFileSelect(event) {
    const file = event.target.files[0]
    if (file) {
      const fileExtension = "." + file.name.split(".").pop().toLowerCase()

      if (this.supportedInputFormats.includes(fileExtension)) {
        this.selectedFile = file
        this.convertedFile = null
        this.fileText.textContent = file.name
        this.fileSize.textContent = this.formatFileSize(file.size)
        this.fileSize.classList.remove("hidden")
        this.updateConvertButton()
        this.hideDownloadButton()
        this.showToast("File Selected", `${file.name} ready for conversion`, "success")
      } else {
        this.showToast("Unsupported Format", "Please select a supported file format", "error")
        this.fileInput.value = ""
      }
    }
  }

  updateConvertButton() {
    const canConvert = this.selectedFile && this.outputFormat.value && !this.isConverting
    this.convertBtn.disabled = !canConvert
  }

  async handleConvert() {
    if (!this.selectedFile || !this.outputFormat.value) {
      this.showToast("Missing Information", "Please select a file and output format", "error")
      return
    }

    this.isConverting = true
    this.convertBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 inline spinner"></i>Converting...'
    this.convertBtn.disabled = true
    this.showProgressBar()
    this.lucide.createIcons()

    try {
      this.showToast("Converting...", "Processing your document", "info")

      const inputFormat = "." + this.selectedFile.name.split(".").pop().toLowerCase()
      const outputFormat = this.outputFormat.value

      // Start conversion process
      const result = await this.convertDocument(this.selectedFile, inputFormat, outputFormat)
      this.convertedFile = result

      this.showDownloadButton(result.filename)
      this.showToast("Conversion Complete", "Your document has been converted successfully", "success")
    } catch (error) {
      console.error("Conversion error:", error)
      this.showToast("Conversion Failed", error.message || "An error occurred during conversion", "error")
    } finally {
      this.isConverting = false
      this.convertBtn.innerHTML = "Convert Document"
      this.updateConvertButton()
      this.hideProgressBar()
      this.lucide.createIcons()
    }
  }

  async convertDocument(file, inputFormat, outputFormat) {
    // Determine conversion path based on input and output formats
    if (inputFormat === outputFormat) {
      throw new Error("Input and output formats are the same")
    }

    // Update progress
    this.updateProgress(10)

    // Read the file
    const fileContent = await this.readFile(file, inputFormat)
    this.updateProgress(30)

    // Convert based on output format
    let result
    if (outputFormat === ".txt") {
      result = await this.convertToText(fileContent, inputFormat)
    } else if (outputFormat === ".pdf") {
      result = await this.convertToPdf(fileContent, inputFormat)
    } else {
      throw new Error("Unsupported output format")
    }

    this.updateProgress(90)

    // Create the output file
    const filename = `${file.name.split(".")[0]}${outputFormat}`
    const mimeType = outputFormat === ".pdf" ? "application/pdf" : "text/plain"
    const blob = new Blob([result], { type: mimeType })

    this.updateProgress(100)

    return { blob, filename }
  }

  async readFile(file, format) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        resolve({
          content: event.target.result,
          format: format,
          name: file.name,
        })
      }

      reader.onerror = () => {
        reject(new Error("Failed to read the file"))
      }

      if (format === ".txt" || format === ".rtf" || format === ".asc") {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }

  async convertToText(fileData, inputFormat) {
    switch (inputFormat) {
      case ".txt":
      case ".asc":
        return fileData.content // Already text

      case ".rtf":
        return this.rtfToText(fileData.content)

      case ".pdf":
        return this.pdfToText(fileData.content)

      case ".docx":
      case ".doc":
        return this.docxToText(fileData.content)

      case ".wps":
      case ".wpd":
      case ".msg":
        throw new Error(`Conversion from ${inputFormat} to .txt is not supported in this web version`)

      default:
        throw new Error("Unsupported input format")
    }
  }

  async convertToPdf(fileData, inputFormat) {
    switch (inputFormat) {
      case ".txt":
      case ".asc":
        return this.textToPdf(fileData.content, fileData.name)

      case ".rtf":
        const plainText = await this.rtfToText(fileData.content)
        return this.textToPdf(plainText, fileData.name)

      case ".docx":
        const docxText = await this.docxToText(fileData.content)
        return this.textToPdf(docxText, fileData.name)

      case ".pdf":
        return fileData.content // Already PDF

      case ".doc":
      case ".wps":
      case ".wpd":
      case ".msg":
        throw new Error(`Conversion from ${inputFormat} to .pdf is not supported in this web version`)

      default:
        throw new Error("Unsupported input format")
    }
  }

  async rtfToText(rtfContent) {
    try {
      // Use RTF.js to convert RTF to text
      const doc = new this.RTF.Document(rtfContent)
      return doc.text()
    } catch (error) {
      console.error("RTF conversion error:", error)
      throw new Error("Failed to convert RTF document")
    }
  }

  async pdfToText(pdfBuffer) {
    try {
      // Use PDF.js to extract text from PDF
      const pdf = await this.pdfjsLib.getDocument({ data: pdfBuffer }).promise
      let text = ""

      // Update progress as we process each page
      const totalPages = pdf.numPages

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((item) => item.str).join(" ")
        text += pageText + "\n\n"

        // Update progress for each page
        this.updateProgress(30 + Math.floor((i / totalPages) * 50))
      }

      return text
    } catch (error) {
      console.error("PDF conversion error:", error)
      throw new Error("Failed to extract text from PDF")
    }
  }

  async docxToText(docxBuffer) {
    try {
      // Use Mammoth.js to convert DOCX to text
      const result = await this.mammoth.extractRawText({ arrayBuffer: docxBuffer })
      return result.value
    } catch (error) {
      console.error("DOCX conversion error:", error)
      throw new Error("Failed to convert DOCX document")
    }
  }

  textToPdf(text, filename) {
    try {
      // Use jsPDF to create PDF from text
      const { jsPDF } = window.jspdf
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(16)
      doc.text("Converted Document", 20, 20)

      // Add metadata
      doc.setFontSize(12)
      doc.text(`Original: ${filename}`, 20, 30)
      doc.text(`Converted: ${new Date().toLocaleString()}`, 20, 40)

      // Add content with line breaks
      doc.setFontSize(12)

      const textLines = text.split("\n")
      let y = 60

      textLines.forEach((line) => {
        // Check if we need a new page
        if (y > 280) {
          doc.addPage()
          y = 20
        }

        // Add the line
        doc.text(line, 20, y)
        y += 7
      })

      return doc.output("arraybuffer")
    } catch (error) {
      console.error("PDF creation error:", error)
      throw new Error("Failed to create PDF document")
    }
  }

  showProgressBar() {
    this.progressContainer.classList.remove("hidden")
    this.updateProgress(0)
  }

  hideProgressBar() {
    this.progressContainer.classList.add("hidden")
  }

  updateProgress(percent) {
    this.progressBar.style.width = `${percent}%`
    this.progressPercent.textContent = `${percent}%`
  }

  handleDownload() {
    if (this.convertedFile) {
      const url = URL.createObjectURL(this.convertedFile.blob)
      const link = document.createElement("a")
      link.href = url
      link.download = this.convertedFile.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      this.showToast("Download Started", "Your converted file is being saved", "success")
    }
  }

  resetConverter() {
    this.selectedFile = null
    this.convertedFile = null
    this.fileInput.value = ""
    this.fileText.textContent = "Select Document"
    this.fileSize.classList.add("hidden")
    this.outputFormat.value = ""
    this.hideDownloadButton()
    this.hideProgressBar()
    this.updateConvertButton()
  }

  showDownloadButton(filename) {
    this.downloadBtn.innerHTML = `<i data-lucide="download" class="w-4 h-4 mr-2 inline"></i>Download ${filename}`
    this.downloadBtn.classList.remove("hidden")
    this.resetBtn.classList.remove("hidden")
    this.lucide.createIcons()
  }

  hideDownloadButton() {
    this.downloadBtn.classList.add("hidden")
    this.resetBtn.classList.add("hidden")
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  showToast(title, message, type = "info") {
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.innerHTML = `
      <div class="font-medium">${title}</div>
      <div class="text-sm opacity-90">${message}</div>
    `

    this.toastContainer.appendChild(toast)

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 100)

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new DocumentConverter()
})
