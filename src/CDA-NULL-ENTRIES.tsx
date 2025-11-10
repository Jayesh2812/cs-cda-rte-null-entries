import { useEffect, useState } from "react";
import { Region } from "@contentstack/delivery-sdk";
import { getCDANullEntries } from "./utils";
import { Button, Input, Select, Table } from "antd";

function CdaNullEntries() {
  const [region, setRegion] = useState<Region | "">("");
  const [accessToken, setAccessToken] = useState("");
  const [branchName, setBranchName] = useState("");
  const [environment, setEnvironment] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const columns = [
    {
      title: "Entry ID",
      dataIndex: "entryId",
    },
    {
      title: "Content Type ID",
      dataIndex: "ctId",
    },
    {
      title: "Locale",
      dataIndex: "locale",
    },
    {
      title: "Version",
      dataIndex: "version",
    },
  ];

  const handleClick = async() => {
    getEntries();
  };

  const [entries, setEntries] = useState<any[]>([]);

  const downloadEntriesAsCSV = () => {
    let csv = entries
      .map((entry) => {
        return `${entry.entryId},${entry.ctId},${entry.locale},${entry.version}`;
      })
      .join("\n");

    csv = `Entry ID,Content Type ID,Locale,Version\n${csv}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "affected_entries.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEntries = async () => {
    saveValuesToLocalStorage()
    console.log("Get Entries", {
      region,
      accessToken,
      branchName,
      environment,
      apiKey,
    });
    
    setLoading((prev) => !prev);
    try {
      const res = await getCDANullEntries(
        region as Region,
        accessToken,
        branchName,
        environment,
        apiKey,
        setMessage
      );
      console.log("Res", res);

      const entries = Array.from(res.affectedEntriesSet as any).map(
        (entry: any) => {
          const [entryId, ctId, locale, version] = entry.split(" - ");
          return {
            entryId,
            ctId,
            locale,
            version,
          };
        }
      );
      setEntries(entries);
    } catch (error) {
      console.error(error);
    }
     finally {
      setLoading((prev) => !prev);
    }
  };

 
  const saveValuesToLocalStorage = () => {
    localStorage.setItem("cda-null-entries-configuration", JSON.stringify({
      region,
      accessToken,
      branchName,
      apiKey,
      environment,
    }));
  }

  useEffect(() => {
    const configuration = localStorage.getItem("cda-null-entries-configuration");
    if(configuration) {
      const { region, accessToken, branchName, environment, apiKey } = JSON.parse(configuration);
      setRegion(region);
      setAccessToken(accessToken);
      setBranchName(branchName);
      setEnvironment(environment);
      setApiKey(apiKey);
    }
  }, []);

  return (
    <>
      <h1>Get Entries with RTE as NULL in CDA</h1>
      <p>We recommend using a access_token different form Production to avoid rate limiting if any</p>

      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <label>Region</label>
          <Select
            value={region}
            onChange={(e) => setRegion(e as Region)}
            options={[
              { value: "", label: "AWS NA" },
              { value: Region.EU, label: "AWS EU" },
              { value: Region.AU, label: "AWS AU" },
              { value: Region.AZURE_NA, label: "AZURE NA" },
              { value: Region.AZURE_EU, label: "AZURE EU" },
              { value: Region.GCP_NA, label: "GCP NA" },
              { value: Region.GCP_EU, label: "GCP EU" },
            ]}
          />
        </div>
        <div>
          <label>API Key</label>
          <Input
            type="text"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div>
          <label>Access Token</label>
          <Input
            type="text"
            placeholder="Access Token"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
        </div>
        <div>
          <label>Branch name</label>
          <Input
            type="text"
            placeholder="Branch name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
        </div>
        <div>
          <label>Environment</label>
          <Input
            type="text"
            placeholder="Environment"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          />
        </div>
      </div>

      <div style={{ margin: "20px auto", width: "fit-content", display: "flex", gap: "10px" }}>
        <Button type="primary" onClick={handleClick} loading={loading}>
          Get affected entries
        </Button>

        <Button onClick={downloadEntriesAsCSV}>Download entries as CSV</Button>
      </div>
      {message && <h5>{message}</h5>}
      <Table  dataSource={entries} loading={loading} columns={columns} />
    </>
  );
}

export default CdaNullEntries;
