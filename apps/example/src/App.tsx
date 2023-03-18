import createRecast from '@three-recast/wasm'
import { useEffect } from "react";

const Recast = await createRecast()

console.log(Recast)

function App() {
  useEffect(() => {
    console.log(Recast)

    const navMesh = new Recast.NavMesh()

    const navMeshData = navMesh.getNavmeshData()

    console.log(navMeshData)

  }, []);

  return <div></div>;
}

export default App;
