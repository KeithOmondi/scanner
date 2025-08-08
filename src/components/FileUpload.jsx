import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FileUpload = () => {
  const [excelFile, setExcelFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [threshold, setThreshold] = useState(100);
  const [loading, setLoading] = useState(false);

  const isValidFileType = (file, types) => file && types.includes(file.type);

  const handleUpload = async () => {
    if (!isValidFileType(excelFile, ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])) {
      alert("Please upload a valid Excel file (.xlsx).");
      return;
    }
    if (!isValidFileType(pdfFile, ["application/pdf"])) {
      alert("Please upload a valid PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("excel", excelFile);
    formData.append("pdf", pdfFile);

    try {
      setLoading(true);
      const res = await fetch(`https://scannerb.onrender.com/match?threshold=${threshold}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data?.matched) {
        setMatches(data.matched);
      } else {
        setMatches([]);
        alert("No matches found.");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("An error occurred while processing your files.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const numberedMatches = matches.map((m, i) => ({
      No: i + 1,
      ...m,
    }));

    const ws = XLSX.utils.json_to_sheet(numberedMatches);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Matched Names");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "Matched_Deceased_Names.xlsx");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧠 Gazette Name Matcher</h1>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setExcelFile(e.target.files[0])}
          className="border p-2"
        />
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
          className="border p-2"
        />

        <div>
          <label className="block mb-1 font-medium">Match Threshold: {threshold}</label>
          <input
            type="range"
            min="80"
            max="100"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Match Names"}
        </button>
      </div>

      {matches.length > 0 && (
        <>
          <div className="mt-6 overflow-auto">
            <h2 className="text-xl font-semibold mb-2">✅ Matched Names:</h2>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border px-3 py-2">No</th>
                  <th className="border px-3 py-2">Excel Name</th>
                  <th className="border px-3 py-2">Gazette Match</th>
                  <th className="border px-3 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{i + 1}</td>
                    <td className="border px-3 py-2">{match.excelName}</td>
                    <td className="border px-3 py-2">{match.gazetteMatch}</td>
                    <td
                      className={`border px-3 py-2 text-center ${
                        match.score < 100 ? "bg-yellow-100 text-yellow-800 font-semibold" : ""
                      }`}
                    >
                      {match.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="my-6">
            <button
              onClick={downloadExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ⬇ Download as Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileUpload;
