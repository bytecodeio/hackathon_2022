import { Octokit } from "@octokit/core"; 
import React, {
    useState,
    useEffect,
  } from 'react'

export const AllRepoCommits = async(dashPath) => {
    // const [commits, setCommits] = useState([]);
    // needs valid auth token to connect to git
    const octokit = new Octokit({ auth: 'xxxxxx', });
  
    const fiveMostRecentCommits = await octokit.request(`GET /repos/{owner}/{repo}/commits`, { owner: "MichelleAMullen", repo: "hackathon_2022", per_page: 5, path: dashPath });
  
    // useEffect(async () => {

  
    //   setCommits(fiveMostRecentCommits);
    for (const item of fiveMostRecentCommits.data) {
        item.filePath = dashPath
    }

    console.log('from allRepoCommits - ', fiveMostRecentCommits.data)
    // }, [])
    // return commits; 

    if (fiveMostRecentCommits.length != 0){
        return(fiveMostRecentCommits.data);
        // return (
        //     <ul>
        //       {commits.data.map(commit => (
        //         <li key={commit.sha}>
        //           {commit.author.name}: {commit.message}
        //         </li>
        //       ))}
        //     </ul>
        //   );
    } 
    else {
        return "";
    }

}
