import React from 'react'
import {render} from '@testing-library/react'

import CalculatorDisplay from '../calculator-display'

test('should first', () => {
  const {container} = render(<CalculatorDisplay value="0" />)

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="css-lq9ahq-calculator-display--CalculatorDisplay"
      >
        <div
          class="autoScalingText"
          data-testid="total"
          style="transform: scale(1,1);"
        >
          0
        </div>
      </div>
    </div>
  `)
})
