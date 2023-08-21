/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, PADDING_RATIO, TABLE } from '@constants';
import { getTransformSort } from '@specBuilder/data/dataUtils';
import { hasPopover } from '@specBuilder/marks/markUtils';
import {
	addDomainFields,
	addFieldToFacetScaleDomain,
	addMetricScale,
	getDefaultScale,
	getMetricScale,
	getScaleIndexByName,
	getScaleIndexByType,
} from '@specBuilder/scale/scaleSpecBuilder';
import { getGenericSignal, getUncontrolledHoverSignal, hasSignalByName } from '@specBuilder/signal/signalSpecBuilder';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { getDefaultMarkName, sanitizeMarkChildren, toCamelCase } from '@utils';
import produce from 'immer';
import { BarProps, BarSpecProps, ColorScheme } from 'types';
import { BandScale, Data, FormulaTransform, Mark, OrdinalScale, Scale, Signal, Spec } from 'vega';

import { getBarPadding, getScaleValues, isDodgedAndStacked } from './barUtils';
import { getDodgedMark } from './dodgedBarUtils';
import { getDodgedAndStackedBarMark, getStackedBarMarks } from './stackedBarUtils';
import { addTrellisScale, getTrellisGroupMark, isTrellised } from './trellisedBarUtils';

export const addBar = produce<Spec, [BarProps & { colorScheme?: ColorScheme }]>(
	(
		spec,
		{
			children,
			color = { value: 'categorical-100' },
			dimension = DEFAULT_CATEGORICAL_DIMENSION,
			groupedPadding,
			lineType = { value: 'solid' },
			lineWidth = 0,
			metric = DEFAULT_METRIC,
			name = getDefaultMarkName(spec, 'rect'),
			opacity = { value: 1 },
			order,
			orientation = 'vertical',
			paddingRatio = PADDING_RATIO,
			paddingOuter,
			colorScheme = DEFAULT_COLOR_SCHEME,
			trellis,
			trellisOrientation = 'horizontal',
			type = 'stacked',
		},
	) => {
		// put props back together now that all defaults are set
		const barProps: BarSpecProps = {
			children: sanitizeMarkChildren(children),
			orientation,
			color,
			dimension,
			groupedPadding,
			lineType,
			lineWidth,
			metric,
			name: toCamelCase(name),
			opacity,
			order,
			paddingRatio,
			paddingOuter,
			colorScheme,
			trellis,
			trellisOrientation,
			type,
		};

		spec.data = addData(spec.data ?? [], barProps);
		spec.signals = addSignals(spec.signals ?? [], barProps);
		spec.scales = addScales(spec.scales ?? [], barProps);
		spec.marks = addMarks(spec.marks ?? [], barProps);
	},
);

export const addSignals = produce<Signal[], [BarSpecProps]>((signals, { children, name }) => {
	if (!children.length) {
		return;
	}
	if (!hasSignalByName(signals, `${name}HoveredId`)) {
		signals.push(getUncontrolledHoverSignal(name));
	}
	if (hasPopover(children)) {
		if (!hasSignalByName(signals, `${name}SelectedId`)) {
			signals.push(getGenericSignal(`${name}SelectedId`));
		}
	}
});

export const addData = produce<Data[], [BarSpecProps]>((data, props) => {
	const { metric, order, type } = props;
	let index = data.findIndex((d) => d.name === TABLE);
	if (index === -1) {
		index = data.length;
		data.push({ name: TABLE });
	}
	data[index].transform = data[index].transform ?? [];
	if (type === 'stacked' || isDodgedAndStacked(props)) {
		data[index].transform?.push({
			type: 'stack',
			groupby: getStackFields(props),
			field: metric,
			sort: getTransformSort(order),
			as: [`${metric}0`, `${metric}1`],
		});

		data[index].transform?.push(getPrismStackIdTransform(props));
		data.push(getStackAggregateData(props));
	}
	if (type === 'dodged' || isDodgedAndStacked(props)) {
		data[index].transform?.push(getDodgeGroupTransform(props));
	}
});

/**
 * data aggregate used to calculate the min and max of the stack
 * used to figure out the corner radius of the bars
 * @param facets
 * @param barSpecProps
 * @returns vega Data object
 */
export const getStackAggregateData = (props: BarSpecProps): Data => {
	const { metric, name } = props;
	return {
		name: `${name}Stacks`,
		source: TABLE,
		transform: [
			{
				type: 'aggregate',
				groupby: getStackFields(props),
				fields: [`${metric}1`, `${metric}1`],
				ops: ['min', 'max'],
			},
			getPrismStackIdTransform(props),
		],
	};
};

export const getPrismStackIdTransform = (props: BarSpecProps): FormulaTransform => {
	return {
		type: 'formula',
		as: 'prismStackId',
		expr: getStackFields(props)
			.map((facet) => `datum.${facet}`)
			.join(' + "," + '),
	};
};

const getStackFields = ({ trellis, color, dimension, lineType, opacity, type }: BarSpecProps): string[] => {
	const { facets, secondaryFacets } = getFacetsFromProps({ color, lineType, opacity });
	return [
		...(trellis ? [trellis] : []),
		dimension,
		...(type === 'dodged' ? facets : []),
		...(type === 'stacked' ? secondaryFacets : []),
	];
};

export const getDodgeGroupTransform = ({ color, lineType, name, opacity, type }: BarSpecProps): FormulaTransform => {
	const { facets, secondaryFacets } = getFacetsFromProps({ color, lineType, opacity });
	return {
		type: 'formula',
		as: `${name}DodgeGroup`,
		expr: (type === 'dodged' ? facets : secondaryFacets).map((facet) => `datum.${facet}`).join(' + "," + '),
	};
};

export const addScales = produce<Scale[], [BarSpecProps]>((scales, props) => {
	const { color, lineType, opacity, orientation } = props;
	addMetricScale(scales, getScaleValues(props), orientation === 'vertical' ? 'y' : 'x');
	addDimensionScale(scales, props);
	addTrellisScale(scales, props);
	addFieldToFacetScaleDomain(scales, 'color', color);
	addFieldToFacetScaleDomain(scales, 'lineType', lineType);
	addFieldToFacetScaleDomain(scales, 'opacity', opacity);
	addSecondaryScales(scales, props);
});

export const addDimensionScale = (
	scales: Scale[],
	{ dimension, paddingRatio, paddingOuter: barPaddingOuter, orientation }: BarSpecProps,
) => {
	const index = getScaleIndexByType(scales, 'band', orientation === 'vertical' ? 'x' : 'y');
	scales[index] = addDomainFields(scales[index], [dimension]);
	const { paddingInner, paddingOuter } = getBarPadding(paddingRatio, barPaddingOuter);
	scales[index] = { ...scales[index], paddingInner, paddingOuter } as BandScale;
};

/**
 * adds scales for the secondary dimensions
 * If a bar is stacked and dodged,
 * @param scales
 * @param param1
 */
export const addSecondaryScales = (scales: Scale[], props: BarSpecProps) => {
	const { color, lineType, opacity } = props;
	if (isDodgedAndStacked(props)) {
		[
			{
				value: color,
				scaleName: 'colors',
				secondaryScaleName: 'secondaryColor',
			},
			{
				value: lineType,
				scaleName: 'lineTypes',
				secondaryScaleName: 'secondaryLineType',
			},
			{
				value: opacity,
				scaleName: 'opacities',
				secondaryScaleName: 'secondaryOpacity',
			},
		].forEach(({ value, scaleName, secondaryScaleName }) => {
			if (Array.isArray(value) && value.length === 2) {
				// secondary value scale used for 2D scales
				const index = getScaleIndexByName(scales, secondaryScaleName, 'ordinal');
				scales[index] = addDomainFields(scales[index], [value[1]]);

				const i = getScaleIndexByName(scales, scaleName, 'ordinal');
				const colorsScale = scales[i] as OrdinalScale;
				colorsScale.range = { signal: scaleName };
			}
		});
	}
};

export const addMarks = produce<Mark[], [BarSpecProps]>((marks, props) => {
	const barMarks: Mark[] = [];
	if (isDodgedAndStacked(props)) {
		barMarks.push(getDodgedAndStackedBarMark(props));
	} else if (props.type === 'stacked') {
		barMarks.push(...getStackedBarMarks(props));
	} else {
		barMarks.push(getDodgedMark(props));
	}

	// if this is a trellis plot, we add the bars and the repeated scale to the trellis group
	if (isTrellised(props)) {
		const repeatedScale = getRepeatedScale(props);
		marks.push(getTrellisGroupMark(props, barMarks, repeatedScale));
	} else {
		marks.push(...barMarks);
	}
});

export const getRepeatedScale = (props: BarSpecProps): Scale => {
	const { orientation, trellisOrientation } = props;
	// if the orientations match then the metric scale is repeated, otherwise the dimension scale is repeated
	// ex. vertical bar in a vertical trellis will have multiple copies of the metric scale
	if (orientation === trellisOrientation) {
		return getMetricScale(getScaleValues(props), orientation === 'vertical' ? 'y' : 'x', orientation);
	} else {
		return getDimensionScale(props);
	}
};

/**
 * Generates a dimension scale and returns it
 * NOTE: does not check if the dimension scale already exists
 * @param param0
 * @returns
 */
const getDimensionScale = ({
	dimension,
	orientation,
	paddingRatio,
	paddingOuter: barPaddingOuter,
}: BarSpecProps): BandScale => {
	let scale = getDefaultScale('band', orientation === 'vertical' ? 'x' : 'y', orientation);
	scale = addDomainFields(scale, [dimension]);
	const { paddingInner, paddingOuter } = getBarPadding(paddingRatio, barPaddingOuter);
	return { ...scale, paddingInner, paddingOuter } as BandScale;
};
