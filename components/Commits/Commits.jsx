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

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  MessageBar,
  Space,
  List,
  ListItem,
  FieldText,
} from '@looker/components'
import { useNavigate } from '../../hooks'

export const Commits = ({
  onSelected,
  data = [],
  dashboardId,
  // error,
  // loading,
  // embedRunning,
  // embedType,
}) => {

  const [criteria, setCriteria] = useState('')
  
  const selectedData =
    criteria.length === 0
      ? data
      : data.filter(({ description }) =>
          description.toLowerCase().includes(criteria.trim().toLowerCase())
        )

  return (
    <>
      <Box height="33%" width="100%" borderBottom="solid 1px" borderColor="ui2">
        <Box overflowY="scroll">
          <List mt="none" density={-2} height="85%">
          <h4>Commit History</h4>
            {data.map(({ commit, sha, filePath }) => (
              <ListItem
                key={sha}
                onClick={() => onSelected(sha, filePath)}
                // disabled={embedRunning}
              >
                {commit.author.name} : {commit.author.date}
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </>
  )
}

Commits.propTypes = {
  data: PropTypes.array,
  // embedRunning: PropTypes.bool,
  // embedType: PropTypes.string,
  // error: PropTypes.string,
  // loading: PropTypes.bool,
  // onSelected: PropTypes.func.isRequired,
}
