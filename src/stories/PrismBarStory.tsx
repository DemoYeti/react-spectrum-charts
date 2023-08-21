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

import usePrismProps from '@hooks/usePrismProps';
import { Axis, Bar, Prism } from '@prism';
import { ComponentStory } from '@storybook/react';
import React, { ReactElement } from 'react';

export const PrismBarStory: ComponentStory<typeof Prism> = (args): ReactElement => {
	const props = usePrismProps(args);
	return (
		<Prism {...props}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Bar dimension="x" metric="y" color="series" />
		</Prism>
	);
};
