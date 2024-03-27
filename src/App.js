import logo from './logo.svg'
import './App.css'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import * as toxicityClassifier from '@tensorflow-models/toxicity'
import { useDebounce } from 'use-debounce'
import { Backdrop, CircularProgress } from '@mui/material'
import { AccessibilityNew, Dangerous, Favorite, GppMaybe, ReportGmailerrorred } from '@mui/icons-material'

function App () {
  const [model, setModel] = useState(null)
  const [enteredText, setEnteredText] = useState('')
  const [textToxicity, setTextToxicity] = useState([])
  const [loading, setLoading] = useState(false)

  const [textToPredict] = useDebounce(enteredText, 1000)
  useEffect(() => {
    async function loadModel () {
      // "threshold" The the confidence interval for the classier.
      // Higher values = the model is more confident about its prediction.
      const threshold = 0.6
      const toxicityModel = await toxicityClassifier.load(threshold)
      setLoading(false);
      setModel(toxicityModel)
    }
    if (model === null) {
      setLoading(true);
      // Only load the model if its current value is null
      loadModel()
    }
  }, [model])

  useEffect(() => {
    predictToxicity(textToPredict)
  }, [textToPredict])

  const predictToxicity = useCallback(
    async textToPredict => {
      if (!model) return
      const predictions = await model.classify([textToPredict])
      setTextToxicity(
        // Sets the "textToxicity" array
        // to the predictions after some filtering and mapping.
        // (console.log) the predictions to see
        // from where this came from.
        predictions
          .filter(item => item.results[0].match === true)
          .map(item => item.label)
      )
    },
    [model]
  )

  const loadingToRender = useMemo(() => {
    return <Backdrop
    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
    open={loading}
    onClick={() => setLoading(false)}
  >
    <CircularProgress color="inherit" />
  </Backdrop>
  }, [loading, setLoading]);

  const renderToxicity = React.useMemo(() => {
    if (textToxicity?.length) {
      return <div className='toxic'>{textToxicity.map(text => {
        if (text === 'identity_attack') {
          return <span><GppMaybe /> Attack </span>
        } else if (text === 'insult') {
          return <span><ReportGmailerrorred /> Insult </span>
        } else if (text === 'toxicity') {
          return <span><Dangerous /> Toxic </span>
        } else if (text === 'obscene') {
          return <span><AccessibilityNew/> Obscene</span>
        }
      })}</div>
    } else if (textToxicity?.length === 0 && textToPredict !== '') {
      return <div className='toxic'><span><Favorite/></span> Looks good</div>
    }
  }, [textToxicity]);

  return (
    <div className='App'>
      {loadingToRender}
      <div className='container'>
        <label>{loading ? 'Loading model' : 'Start typing...'}</label>
        <textarea
          className='textarea'
          rows={5}
          type='text'
          onChange={event => setEnteredText(event.target?.value)}
          placeholder='Enter text'
        />
        {renderToxicity}
      </div>
    </div>
  )
}

export default App
