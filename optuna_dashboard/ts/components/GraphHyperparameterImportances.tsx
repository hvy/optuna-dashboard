import * as plotly from "plotly.js-dist-min"
import React, { FC, useEffect, useState } from "react"
import {
  Grid,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  Typography,
  SelectChangeEvent,
  useTheme,
  Box,
  Card,
  CardContent,
} from "@mui/material"
import Grid2 from "@mui/material/Unstable_Grid2"

import { plotlyDarkTemplate } from "./PlotlyDarkMode"
import { actionCreator } from "../action"
import { useParamImportanceValue, useStudyDirections } from "../state"
const plotDomId = "graph-hyperparameter-importances"
const getPlotDomId = (objectiveId: number) => `graph-importance-${objectiveId}`

export const GraphHyperparameterImportanceBeta: FC<{
  studyId: number
  study: StudyDetail | null
  graphHeight: string
}> = ({ studyId, study = null, graphHeight }) => {
  const theme = useTheme()
  const action = actionCreator()
  const importances = useParamImportanceValue(studyId)
  const numCompletedTrials =
    study?.trials.filter((t) => t.state === "Complete").length || 0
  const nObjectives = useStudyDirections(studyId)?.length
  const objectiveNames: string[] = study?.objective_names || []

  useEffect(() => {
    action.updateParamImportance(studyId)
  }, [numCompletedTrials])

  useEffect(() => {
    if (importances !== null && nObjectives === importances.length) {
      plotParamImportancesBeta(importances, theme.palette.mode)
    }
  }, [nObjectives, importances, theme.palette.mode])

  return (
    <>
      {Array.from({ length: nObjectives || 1 }, (_, i) => {
        let title = `Importance for the Objective Value`
        if (nObjectives != null && nObjectives > 1) {
          if (objectiveNames.length == nObjectives) {
            title = `Importance for ${objectiveNames[i]} (Objective ${i})`
          } else {
            title = `Importance for the Objective ${i}`
          }
        }
        return (
          <Grid2 key={i} xs={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ margin: "1em 0", fontWeight: 600 }}
                >
                  {title}
                </Typography>
                <Box id={getPlotDomId(i)} sx={{ height: graphHeight }} />
              </CardContent>
            </Card>
          </Grid2>
        )
      })}
    </>
  )
}

const plotParamImportancesBeta = (
  importances: ParamImportance[][],
  mode: string
) => {
  const layout: Partial<plotly.Layout> = {
    xaxis: {
      title: "Hyperparameter Importance",
    },
    yaxis: {
      title: "Hyperparameter",
      automargin: true,
    },
    margin: {
      l: 50,
      t: 0,
      r: 50,
      b: 50,
    },
    showlegend: false,
    template: mode === "dark" ? plotlyDarkTemplate : {},
  }

  importances.forEach((importance, objectiveId) => {
    if (document.getElementById(getPlotDomId(objectiveId)) === null) {
      return
    }

    const reversed = [...importance].reverse()
    const importance_values = reversed.map((p) => p.importance)
    const param_names = reversed.map((p) => p.name)
    const param_hover_templates = reversed.map(
      (p) => `${p.name} (${p.distribution}): ${p.importance} <extra></extra>`
    )
    const plotData: Partial<plotly.PlotData>[] = [
      {
        type: "bar",
        orientation: "h",
        x: importance_values,
        y: param_names,
        text: importance_values.map((v) => String(v.toFixed(2))),
        textposition: "outside",
        hovertemplate: param_hover_templates,
        marker: {
          color: "rgb(66,146,198)",
        },
      },
    ]
    plotly.react(getPlotDomId(objectiveId), plotData, layout)
  })
}

export const GraphHyperparameterImportances: FC<{
  study: StudyDetail | null
  studyId: number
}> = ({ study = null, studyId }) => {
  const theme = useTheme()
  const action = actionCreator()
  const importances = useParamImportanceValue(studyId)
  const [objectiveId, setObjectiveId] = useState<number>(0)
  const numCompletedTrials =
    study?.trials.filter((t) => t.state === "Complete").length || 0

  const handleObjectiveChange = (event: SelectChangeEvent<number>) => {
    setObjectiveId(event.target.value as number)
  }

  useEffect(() => {
    action.updateParamImportance(studyId)
  }, [numCompletedTrials])

  useEffect(() => {
    if (importances !== null && importances.length > objectiveId) {
      plotParamImportances(importances[objectiveId], theme.palette.mode)
    }
  }, [importances, objectiveId, theme.palette.mode])

  return (
    <Grid container direction="row">
      <Grid
        item
        xs={3}
        container
        direction="column"
        sx={{ paddingRight: theme.spacing(2) }}
      >
        <Typography variant="h6" sx={{ margin: "1em 0", fontWeight: 600 }}>
          Hyperparameter importance
        </Typography>
        {study !== null && study.directions.length !== 1 ? (
          <FormControl component="fieldset">
            <FormLabel component="legend">Objective ID:</FormLabel>
            <Select value={objectiveId} onChange={handleObjectiveChange}>
              {study.directions.map((d, i) => (
                <MenuItem value={i} key={i}>
                  {i}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Grid>
      <Grid item xs={9}>
        <Box id={plotDomId} sx={{ height: "450px" }} />
      </Grid>
    </Grid>
  )
}

const plotParamImportances = (importance: ParamImportance[], mode: string) => {
  if (document.getElementById(plotDomId) === null) {
    return
  }
  const reversed = [...importance].reverse()
  const importance_values = reversed.map((p) => p.importance)
  const param_names = reversed.map((p) => p.name)
  const param_hover_templates = reversed.map(
    (p) => `${p.name} (${p.distribution}): ${p.importance} <extra></extra>`
  )

  const layout: Partial<plotly.Layout> = {
    xaxis: {
      title: `Importance for the Objective Value`,
    },
    yaxis: {
      title: "Hyperparameter",
      automargin: true,
    },
    margin: {
      l: 50,
      t: 0,
      r: 50,
      b: 50,
    },
    showlegend: false,
    template: mode === "dark" ? plotlyDarkTemplate : {},
  }

  const plotData: Partial<plotly.PlotData>[] = [
    {
      type: "bar",
      orientation: "h",
      x: importance_values,
      y: param_names,
      text: importance_values.map((v) => String(v.toFixed(2))),
      textposition: "outside",
      hovertemplate: param_hover_templates,
      marker: {
        color: "rgb(66,146,198)",
      },
    },
  ]

  plotly.react(plotDomId, plotData, layout)
}
