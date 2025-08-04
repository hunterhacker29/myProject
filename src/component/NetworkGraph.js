// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import './NetworkGraph.css'; // Create this file for styles

// const NetworkGraph = () => {
//   const [network, setNetwork] = useState(null);
//   const [simulation, setSimulation] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchData = async () => {
//     try {
//       setIsLoading(true);
//       const [networkRes, stateRes] = await Promise.all([
//         axios.get('/api/network'),
//         axios.get('/api/state')
//       ]);
//       setNetwork(networkRes.data);
//       setSimulation(stateRes.data);
//       setError(null);
//     } catch (err) {
//       setError('Failed to fetch network data');
//       console.error(err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleControl = async (action) => {
//     try {
//       await axios.post(`/api/${action}`);
//       await fetchData();
//     } catch (err) {
//       console.error(`Error ${action}ing simulation:`, err);
//     }
//   };

//   useEffect(() => {
//     fetchData();
    
//     // Set up polling when simulation is running
//     const intervalId = simulation?.isRunning 
//       ? setInterval(fetchData, 1000)
//       : null;
    
//     return () => {
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [simulation?.isRunning]);

//   if (isLoading) return <div className="loading">Loading network data...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (!network || !simulation) return null;

//   return (
//     <div className="network-simulator">
//       <h1>Telecom Network Traffic Simulator</h1>
      
//       <div className="controls">
//         <button 
//           onClick={() => handleControl('start')} 
//           disabled={simulation.isRunning}
//           className="control-btn start"
//         >
//           Start Simulation
//         </button>
//         <button 
//           onClick={() => handleControl('stop')} 
//           disabled={!simulation.isRunning}
//           className="control-btn stop"
//         >
//           Stop Simulation
//         </button>
//         <button 
//           onClick={() => handleControl('reset')}
//           className="control-btn reset"
//         >
//           Reset Simulation
//         </button>
//         <div className="simulation-time">
//           Current Time: <strong>{simulation.time}</strong>
//         </div>
//       </div>

//       <div className="network-container">
//         <div className="network-visualization">
//           {network.nodes.map(node => {
//             const nodeState = simulation.nodes[node];
//             const queueSize = nodeState.queue.length;
//             const utilization = queueSize > 15 ? 'high' : queueSize > 5 ? 'medium' : 'low';
            
//             return (
//               <div 
//                 key={node} 
//                 className={`node ${utilization}`}
//                 data-tooltip={`Node ${node}: ${queueSize} packets in queue`}
//               >
//                 <div className="node-label">{node}</div>
//                 <div className="node-stats">
//                   <div>Queue: {queueSize}</div>
//                   <div>Generated: {nodeState.generated}</div>
//                   <div>Processed: {nodeState.processed}</div>
//                 </div>
//               </div>
//             );
//           })}
          
//           {network.links.map((link, index) => {
//             const linkState = simulation.links[index];
//             const utilization = linkState.currentLoad / linkState.capacity;
//             const utilizationClass = utilization > 0.8 ? 'high' : utilization > 0.5 ? 'medium' : 'low';
            
//             return (
//               <div 
//                 key={index} 
//                 className={`link ${utilizationClass}`}
//                 data-from={link.from}
//                 data-to={link.to}
//                 data-tooltip={`${link.from}-${link.to}: ${linkState.currentLoad}/${linkState.capacity} packets`}
//               >
//                 <div className="link-stats">
//                   {linkState.currentLoad}/{linkState.capacity}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
        
//         <div className="network-stats">
//           <h3>Network Statistics</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Node</th>
//                 <th>Generated</th>
//                 <th>Processed</th>
//                 <th>Queue</th>
//                 <th>Dropped</th>
//               </tr>
//             </thead>
//             <tbody>
//               {network.nodes.map(node => {
//                 const stats = simulation.nodes[node];
//                 return (
//                   <tr key={node}>
//                     <td>{node}</td>
//                     <td>{stats.generated}</td>
//                     <td>{stats.processed}</td>
//                     <td>{stats.queue.length}</td>
//                     <td>{stats.dropped}</td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NetworkGraph;


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NetworkGraph.css';

const NetworkGraph = () => {
  const [network, setNetwork] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [networkRes, stateRes] = await Promise.all([
        axios.get('/api/network'),
        axios.get('/api/state')
      ]);
      setNetwork(networkRes.data);
      setSimulation(stateRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch network data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleControl = async (action) => {
    try {
      console.log(`Attempting to ${action} simulation`);
      const response = await axios({
        method: 'post',
        url: `/api/${action}`,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Response:', response.data);
      setSimulation(response.data);
      
      if (action === 'start') {
        setRefreshInterval(setInterval(fetchData, 1000));
      } else if (action === 'stop' || action === 'reset') {
        if (refreshInterval) {
          clearInterval(refreshInterval);
          setRefreshInterval(null);
        }
      }
    } catch (err) {
      console.error(`Error ${action}ing simulation:`, err.response || err);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  if (isLoading) return <div className="loading">Loading network data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!network || !simulation) return null;

  return (
    <div className="network-simulator">
      <h1>Telecom Network Traffic Simulator</h1>
      
      <div className="controls">
        <button 
          onClick={() => handleControl('start')} 
          disabled={simulation.isRunning}
          className="control-btn start"
        >
          Start Simulation
        </button>
        <button 
          onClick={() => handleControl('stop')} 
          disabled={!simulation.isRunning}
          className="control-btn stop"
        >
          Stop Simulation
        </button>
        <button 
          onClick={() => handleControl('reset')}
          className="control-btn reset"
        >
          Reset Simulation
        </button>
        <div className="simulation-time">
          Current Time: <strong>{simulation.time}</strong>
        </div>
      </div>

      <div className="network-container">
        <div className="network-visualization">
          {network.nodes.map(node => {
            const nodeState = simulation.nodes[node];
            const queueSize = nodeState.queue.length;
            const utilization = queueSize > 15 ? 'high' : queueSize > 5 ? 'medium' : 'low';
            
            return (
              <div 
                key={node} 
                className={`node ${utilization}`}
                data-tooltip={`Node ${node}: ${queueSize} packets in queue`}
              >
                <div className="node-label">{node}</div>
                <div className="node-stats">
                  <div>Queue: {queueSize}</div>
                  <div>Generated: {nodeState.generated}</div>
                  <div>Processed: {nodeState.processed}</div>
                </div>
              </div>
            );
          })}
          
          {network.links.map((link, index) => {
            const linkState = simulation.links[index];
            const utilization = linkState.currentLoad / linkState.capacity;
            const utilizationClass = utilization > 0.8 ? 'high' : utilization > 0.5 ? 'medium' : 'low';
            
            return (
              <div 
                key={index} 
                className={`link ${utilizationClass}`}
                data-from={link.from}
                data-to={link.to}
                data-tooltip={`${link.from}-${link.to}: ${linkState.currentLoad}/${linkState.capacity} packets`}
              >
                <div className="link-stats">
                  {linkState.currentLoad}/{linkState.capacity}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="network-stats">
          <h3>Network Statistics</h3>
          <table>
            <thead>
              <tr>
                <th>Node</th>
                <th>Generated</th>
                <th>Processed</th>
                <th>Queue</th>
                <th>Dropped</th>
              </tr>
            </thead>
            <tbody>
              {network.nodes.map(node => {
                const stats = simulation.nodes[node];
                return (
                  <tr key={node}>
                    <td>{node}</td>
                    <td>{stats.generated}</td>
                    <td>{stats.processed}</td>
                    <td>{stats.queue.length}</td>
                    <td>{stats.dropped}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;