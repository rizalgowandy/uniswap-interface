import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { I18nManager, LayoutChangeEvent } from 'react-native'
import { Flex, ImpactFeedbackStyle, Text, TouchableArea } from 'ui/src'
import { LeftArrow, RightArrow } from 'ui/src/components/icons'
import { fonts } from 'ui/src/theme'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { DecimalPadProps, KeyAction, KeyLabel } from 'uniswap/src/features/transactions/DecimalPadInput/types'

type KeyProps = {
  action: KeyAction
  label: KeyLabel
  hidden?: boolean
}

type SizeMultiplier = {
  fontSize: number
  icon: number
  lineHeight: number
  padding: number
}

export const DecimalPad = memo(function DecimalPad({
  disabled = false,
  hideDecimal = false,
  disabledKeys = {},
  maxHeight,
  onKeyPress,
  onKeyLongPress,
  onReady,
  onTriggerInputShakeAnimation,
}: DecimalPadProps): JSX.Element {
  const currentHeightRef = useRef<number | null>(null)
  const maxHeightRef = useRef<number | null>(maxHeight)
  const [currentHeight, setCurrentHeight] = useState<number | null>(null)
  const [sizeMultiplier, setSizeMultiplier] = useState<SizeMultiplier>({
    fontSize: 1,
    icon: 1,
    lineHeight: 1,
    padding: 1,
  })

  const keys: KeyProps[][] = useMemo(() => {
    return [
      [
        {
          label: '1',
          action: KeyAction.Insert,
        },
        {
          label: '2',
          action: KeyAction.Insert,
        },
        {
          label: '3',
          action: KeyAction.Insert,
        },
      ],
      [
        { label: '4', action: KeyAction.Insert },
        { label: '5', action: KeyAction.Insert },
        { label: '6', action: KeyAction.Insert },
      ],
      [
        { label: '7', action: KeyAction.Insert },
        { label: '8', action: KeyAction.Insert },
        { label: '9', action: KeyAction.Insert },
      ],
      [
        {
          label: '.',
          action: KeyAction.Insert,
          hidden: hideDecimal,
        },
        { label: '0', action: KeyAction.Insert, align: 'center' },
        {
          label: 'backspace',
          action: KeyAction.Delete,
        },
      ],
    ]
  }, [hideDecimal])

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setCurrentHeight(event.nativeEvent.layout.height)
  }, [])

  useEffect(() => {
    currentHeightRef.current = currentHeight
    maxHeightRef.current = maxHeight

    if (currentHeight === null || maxHeight === null) {
      return
    }

    if (currentHeight < maxHeight) {
      // We call `onReady` on the next tick in case the layout is still changing and `maxHeight` is now different.
      setTimeout(() => {
        if (
          currentHeightRef.current !== null &&
          maxHeightRef.current !== null &&
          currentHeightRef.current < maxHeightRef.current
        ) {
          onReady()
        }
      }, 0)
      return
    }

    setSizeMultiplier({
      fontSize: sizeMultiplier.fontSize * 0.95,
      icon: sizeMultiplier.icon * 0.97,
      lineHeight: sizeMultiplier.lineHeight * 0.95,
      padding: sizeMultiplier.padding * 0.8,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHeight, maxHeight])

  if (maxHeight === null) {
    return <></>
  }

  return (
    <Flex onLayout={onLayout}>
      {keys.map((row, rowIndex) => (
        <Flex key={rowIndex} row alignItems="center">
          {row.map((key, keyIndex) => {
            const isNumberKey =
              key.label.charCodeAt(0) >= '0'.charCodeAt(0) && key.label.charCodeAt(0) <= '9'.charCodeAt(0)

            const isKeyDisabled = disabled || disabledKeys[key.label]
            const shouldTriggerShake = isKeyDisabled && isNumberKey

            return key.hidden ? (
              <Flex key={keyIndex} alignItems="center" width="50%" />
            ) : (
              <KeyButton
                {...key}
                key={keyIndex}
                // Unless the entire `DecimalPad` is disabled, we only truly disable and gray out the decimal separator and backspace keys.
                // We never gray out the number keys. Instead we trigger a shake animation if the user presses them when they're "disabled".
                // Because of this, we don't set the `disabled` prop on the number keys so we can trigger the `onPress` event.
                disabled={disabled || (isKeyDisabled && !shouldTriggerShake)}
                sizeMultiplier={sizeMultiplier}
                onLongPress={shouldTriggerShake ? onTriggerInputShakeAnimation : onKeyLongPress}
                onPress={shouldTriggerShake ? onTriggerInputShakeAnimation : onKeyPress}
              />
            )
          })}
        </Flex>
      ))}
    </Flex>
  )
})

type KeyButtonProps = KeyProps & {
  disabled?: boolean
  sizeMultiplier: SizeMultiplier
  onPress?: (label: KeyLabel, action: KeyAction) => void
  onLongPress?: (label: KeyLabel, action: KeyAction) => void
}

const KeyButton = memo(function KeyButton({
  action,
  disabled,
  label,
  sizeMultiplier,
  onPress,
  onLongPress,
}: KeyButtonProps): JSX.Element {
  const { decimalSeparator } = useAppFiatCurrencyInfo()

  const handlePress = (): void => {
    if (disabled) {
      return
    }
    onPress?.(label, action)
  }

  const handleLongPress = (): void => {
    if (disabled) {
      return
    }
    onLongPress?.(label, action)
  }

  const color = disabled ? '$neutral3' : '$neutral1'

  return (
    <TouchableArea
      hapticFeedback
      ignoreDragEvents
      flexDirection="row"
      $short={{ py: 16 * sizeMultiplier.padding }}
      activeOpacity={1}
      alignItems="center"
      disabled={disabled}
      flex={1}
      hapticStyle={ImpactFeedbackStyle.Light}
      height="100%"
      px={16 * sizeMultiplier.padding}
      py={12 * sizeMultiplier.padding}
      scaleTo={1.2}
      testID={'decimal-pad-' + label}
      onLongPress={handleLongPress}
      onPress={handlePress}
    >
      <Flex grow alignItems="center">
        {label === 'backspace' ? (
          I18nManager.isRTL ? (
            <RightArrow color={color} size={24 * sizeMultiplier.icon} />
          ) : (
            <LeftArrow color={color} size={24 * sizeMultiplier.icon} />
          )
        ) : (
          <Text
            color={color}
            style={{
              lineHeight: fonts.heading2.lineHeight * sizeMultiplier.lineHeight,
              fontSize: fonts.heading2.fontSize * sizeMultiplier.fontSize,
            }}
            textAlign="center"
          >
            {
              label === '.' ? decimalSeparator : label
              /* respect phone settings to show decimal separator in the numpad,
               * but in the input we always have '.' as a decimal separator for now*/
            }
          </Text>
        )}
      </Flex>
    </TouchableArea>
  )
})