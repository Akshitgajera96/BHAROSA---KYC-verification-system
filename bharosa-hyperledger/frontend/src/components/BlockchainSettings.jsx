import { useState } from "react";
import axios from "../services/api";

export default function BlockchainSettings() {
  const [network, setNetwork] = useState("");
  const [contract, setContract] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const saveSettings = async () => {
    await axios.post("/api/settings/blockchain", { network, contract, privateKey });
    alert("Blockchain settings updated!");
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Blockchain Configuration</h2>
      <input className="border p-2 m-1 w-full" placeholder="RPC Network URL" onChange={e => setNetwork(e.target.value)} />
      <input className="border p-2 m-1 w-full" placeholder="Contract Address" onChange={e => setContract(e.target.value)} />
      <input className="border p-2 m-1 w-full" placeholder="Private Key" onChange={e => setPrivateKey(e.target.value)} />
      <button onClick={saveSettings} className="bg-blue-500 text-white p-2 rounded mt-2">Save</button>
    </div>
  );
}
