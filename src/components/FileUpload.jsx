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
      return alert("Please upload a valid Excel file.");
    }
    if (!isValidFileType(pdfFile, ["application/pdf"])) {
      return alert("Please upload a valid PDF file.");
    }

    const formData = new FormData();
    formData.append("excel", excelFile);
    formData.append("pdf", pdfFile);

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/match?threshold=${threshold}`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.matched)) {
        setMatches(data.matched);
      } else {
        setMatches([]);
        alert("No matches found or error occurred.");
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("An error occurred while processing.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const numbered = matches.map((m, i) => ({
      No: i + 1,
      ...m,
    }));

    const ws = XLSX.utils.json_to_sheet(numbered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Matched");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "Matched_Deceased_Names.xlsx");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📑 Gazette Name Matcher</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input type="file" accept=".xlsx" onChange={e => setExcelFile(e.target.files[0])} className="border p-2" />
        <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0])} className="border p-2" />
        <div>
          <label className="block font-medium">Match Threshold: {threshold}</label>
          <input
            type="range"
            min="80"
            max="100"
            value={threshold}
            step="1"
            onChange={e => setThreshold(e.target.value)}
            className="w-full"
          />
        </div>
        <button
          disabled={loading}
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Match Names"}
        </button>
      </div>

      {matches.length > 0 && (
        <>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="border px-3 py-2">No</th>
                <th className="border px-3 py-2">Name of The Deceased</th>
                <th className="border px-3 py-2">Gazette Match</th>
                <th className="border px-3 py-2">Score</th>
                <th className="border px-3 py-2">Gazette Date</th>
                <th className="border px-3 py-2">Status at G.P</th>
                <th className="border px-3 py-2">Approval Date</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{i + 1}</td>
                  <td className="border px-3 py-2">{m.nameOfTheDeceased}</td>
                  <td className="border px-3 py-2">{m.gazetteMatch}</td>
                  <td className={`border px-3 py-2 text-center ${m.score < 100 ? "bg-yellow-100 text-yellow-700" : ""}`}>{m.score}</td>
                  <td className="border px-3 py-2">{m.gazetteDate}</td>
                  <td className="border px-3 py-2">{m.statusAtGP}</td>
                  <td className="border px-3 py-2">{m.approvalDate}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <button
              onClick={downloadExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ⬇ Download Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileUpload;
