/*

 MIT License

 Copyright (c) 2022 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

 import React, {
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Layout,
  Page,
  Aside,
  Section,
  MessageBar,
  Box,
  SpaceVertical,
  FieldToggleSwitch,
  Space,
} from '@looker/components'
import { ExtensionContext40 } from '@looker/extension-sdk-react'
import { LookerExtensionSDK40 } from '@looker/extension-sdk'
import { LookerEmbedSDK } from '@looker/embed-sdk'
import {
  useCurrentRoute,
  useNavigate,
  useListenEmbedEvents,
  useAllDashboards
} from '../../hooks'
import { AllRepoCommits } from '../../hooks/get_all_commits.jsx'
import { Search } from '../Search'
import { Commits } from '../Commits'
import { EmbedContainer } from '../EmbedContainer'
import { EmbedEvents } from '../EmbedEvents'
import { Buffer } from "buffer"
import { Octokit } from "@octokit/rest"
import { Base64 } from "js-base64"
import { typeOf } from 'react-is'

export const DashboardEmbedNext = ({ embedType }) => {
  const [cancelEvents, setCancelEvents] = useState(true)
  const cancelEventsRef = useRef()
  cancelEventsRef.current = cancelEvents
  const { embedId } = useCurrentRoute(embedType)
  const { updateEmbedId } = useNavigate(embedType)
  const { extensionSDK } = useContext(ExtensionContext40)
  const coreSDK = LookerExtensionSDK40.createClient(extensionSDK)
  const [message, setMessage] = useState()
  const [running, setRunning] = useState(false)
  const [dashboardId, setDashboardId] = useState()
  const [dashboard, setDashboard] = useState()
  const { embedEvents, listenEmbedEvents, clearEvents } = useListenEmbedEvents()
  const { data, isLoading, error } = useAllDashboards()
  const [commitData, setCommitData] = useState()
  // needs valid auth token to connect to git
  const octokit = new Octokit({ auth: 'xxxx', })
  const [commits, setCommits] = useState([]);
  const results = (data || []).map(({ id, title }) => ({
    description: title,
    id,
  }))



  useEffect(() => {
    if (dashboardId && dashboardId !== embedId) {
      if (dashboard) {
        updateEmbedId(dashboardId)
        dashboard.loadDashboard(dashboardId)
        setMessage(undefined)
      }
    }

  }, [dashboardId, embedId, dashboard])

  const maybeCancel = () => {
    return { cancel: cancelEventsRef.current }
  }  
  
  const dashRunComplete = (event) => {
  
    const path = `${event.dashboard.id}.dashboard.lookml`;

    const initialize = async () => {
      let commitData = await AllRepoCommits(path)
      setCommitData(commitData)
    }
    initialize()
  }

  const updateRunButton = (running) => {
    setRunning(running)
  }

  const setupDashboard = (dashboard) => {
    setDashboard(dashboard)
  }

  async function getSHA(path) {
    try {
      const result = await octokit.repos.getContent({
        owner: "MichelleAMullen",
        repo: "hackathon_2022",
        path,
      });
    
      const sha = result?.data?.sha;
    
      return sha;
    }
    catch{
      const sha = '';
    
      return sha;
    }
  }

  async function commitLookML(dashboardInfo) {
    const path = `${dashboardInfo.dashboard_id}.dashboard.lookml`;
    const sha = await getSHA(path);
    const currentUser = await coreSDK.ok(coreSDK.me())
    const userName = currentUser.display_name
    const userEmail = currentUser.email
  
    const result = await octokit.repos.createOrUpdateFileContents({
      owner: "MichelleAMullen",
      repo: "hackathon_2022",
      path,
      message: `Add version "${dashboardInfo.dashboard_id}"`,
      author: {
          name: `"${userName}"`,
          email: `"${userEmail}"`
      },
      committer: {
          name: `"${userName}"`,
          email: `"${userEmail}"`
      },
      content: Base64.encode(`${dashboardInfo.lookml}`),
      sha,
    });
  
    return result?.status || 500;
  }

  async function writeInitLookML(dashboardInfo) {
    const path = `${dashboardInfo.dashboard_id}.dashboard.lookml`;
    const currentUser = await coreSDK.ok(coreSDK.me())
    const userName = currentUser.display_name
    const userEmail = currentUser.email
  
    const result = await octokit.repos.createOrUpdateFileContents({
      owner: "MichelleAMullen",
      repo: "hackathon_2022",
      path,
      message: `Add version "${dashboardInfo.dashboard_id}"`,
      author: {
          name: `"${userName}"`,
          email: `"${userEmail}"`
      },
      committer: {
        name: `"${userName}"`,
        email: `"${userEmail}"`
      },
      content: Base64.encode(`${dashboardInfo.lookml}`),
    });
  
    return result?.status || 500;
  }

  const getDashLookml = async(event) => {
    const path = `${event.dashboard.id}.dashboard.lookml`;
    const dashboardInfo = await coreSDK.ok(coreSDK.dashboard_lookml(event.dashboard.id))

    const result = commitLookML(dashboardInfo);

    dashRunComplete(event)

  }

  const checkDashLookml = async(event) => {
    const dashboardInfo = await coreSDK.ok(coreSDK.dashboard_lookml(event.dashboard.id))

    const path = `${dashboardInfo.dashboard_id}.dashboard.lookml`;
    const sha = await getSHA(path);

    if (sha == '') {
      const result = writeInitLookML(dashboardInfo);   

  
    }
    else {
      console.log("file already exists")
    }

    dashRunComplete(event)

  }

  const embedCtrRef = useCallback((el) => {
    setMessage(undefined)
    if (el) {
      const hostUrl = extensionSDK.lookerHostData?.hostUrl
      if (hostUrl) {
        let initialId
        if (embedId && embedId !== '') {
          setDashboardId(embedId)
          initialId = embedId
        } else {
          initialId = 'preload'
        }
        LookerEmbedSDK.init(hostUrl)
        const embed = LookerEmbedSDK.createDashboardWithId(initialId)
          .withTheme("Looker")
          .withNext()
          .appendTo(el)
          .on('dashboard:run:start', updateRunButton.bind(null, true))
          .on('dashboard:run:complete', updateRunButton.bind(null, false))
          .on('dashboard:run:complete', dashRunComplete)
          .on('drillmenu:click', maybeCancel)
          .on('drillmodal:explore', maybeCancel)
          .on('dashboard:tile:explore', maybeCancel)
          .on('dashboard:tile:view', maybeCancel)
          .on('dashboard:edit:start', checkDashLookml)
          .on('dashboard:save:complete', getDashLookml)
        listenEmbedEvents(embed)
        if (initialId === 'preload') {
          embed.on('page:changed', updateRunButton.bind(null, false))
        }
        embed
          .build()
          .connect()
          .then(setupDashboard)
          .catch((error) => {
            console.error('Connection error', error)
            setMessage('Error setting up embed environment')
          })
      }
    }
  }, [])

  const onSelected = (id) => {
    if (id !== dashboardId) {
      setDashboardId(id)
    }
  }

  const onClicked = async(sha, filePath) => {
    if (confirm('Are you sure you want to restore this commit?')) {

      const result = await octokit.repos.getContent({
        owner: "MichelleAMullen",
        repo: "hackathon_2022",
        ref: sha,
        path: filePath,
      });

      const dashId = String(filePath).split(".")[0]
     
      
      const dash = await coreSDK.ok(coreSDK.dashboard(dashId))
      const dashFolder = dash.folder.id


      const lookml = Base64.decode(result.data.content)

      const dashYaml = JSON.stringify(lookml)
 
      const body = {
        folder_id: dashFolder,
        lookml: lookml
      }

      const jsonBody = JSON.stringify(body)



      coreSDK.import_dashboard_from_lookml(jsonBody)


      console.log('Thing was saved to the database.');


    } else {
      // Do nothing!
      console.log('Thing was not saved to the database.');
    }
  }

  const toggleCancelEvents = async (e) => {
    setCancelEvents(e.target.checked)
  }

  const runDashboard = () => {
    if (dashboard) {
      dashboard.run()
    }
  }

  return (
    <Page height="100%">
      <Layout hasAside height="100%">
        <Section height="100%" px="small">
          <>
            {message && <MessageBar intent="critical">{message}</MessageBar>}
            <Box py="5px">
              <Space>
                <Button
                  onClick={runDashboard}
                  disabled={!dashboardId || running}
                >
                  Run Dashboard
                </Button>
                <FieldToggleSwitch
                  label="Cancel embed events"
                  onChange={toggleCancelEvents}
                  on={cancelEvents}
                />
              </Space>
            </Box>
            <EmbedContainer ref={embedCtrRef} />
          </>
        </Section>
        <Aside width="25%" height="100%" pr="small">
          <SpaceVertical height="100%">
            <Search
              onSelected={onSelected}
              loading={isLoading}
              error={error}
              data={results}
              embedRunning={running}
              embedType={embedType}
            />
            {/* <EmbedEvents events={embedEvents} clearEvents={clearEvents} /> */}
            <Commits
              onSelected={onClicked}
              // loading={isLoading}
              // error={error}
              data={commitData}
              // dashboardID={dashboardId}
              // embedRunning={running}
              // embedType={embedType}
            />
          </SpaceVertical>
        </Aside>
      </Layout>
    </Page>
  )
}

DashboardEmbedNext.propTypes = {
  embedType: PropTypes.string.isRequired,
}
