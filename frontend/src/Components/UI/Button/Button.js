import React from 'react';
import styled, { css } from 'styled-components';
import theme from '../../../utils/theme';

// Base button styles
const BaseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ size }) => 
    size === 'sm' ? '6px 12px' : 
    size === 'lg' ? '12px 24px' : 
    '10px 16px'};
  font-size: ${({ size }) => 
    size === 'sm' ? theme.typography.fontSize.sm : 
    size === 'lg' ? theme.typography.fontSize.lg : 
    theme.typography.fontSize.md};
  font-weight: ${theme.typography.fontWeight.medium};
  border-radius: ${theme.borders.radius.md};
  transition: all ${theme.transitions.normal};
  cursor: pointer;
  text-align: center;
  gap: 8px;
  border: none;
  line-height: 1.5;
  white-space: nowrap;
  text-decoration: none;
  
  ${({ disabled }) => disabled && css`
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  `}
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
  }
  
  ${({ fullWidth }) => fullWidth && css`
    width: 100%;
  `}
  
  ${({ withIcon }) => withIcon && css`
    svg {
      font-size: 1.2em;
      margin-right: ${({ iconOnly }) => iconOnly ? '0' : '6px'};
    }
  `}
`;

// Primary button variant
const PrimaryButton = styled(BaseButton)`
  background-color: ${theme.colors.primary.main};
  color: ${theme.colors.primary.contrastText};
  
  &:hover, &:focus {
    background-color: ${theme.colors.primary.dark};
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.sm};
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Secondary button variant
const SecondaryButton = styled(BaseButton)`
  background-color: ${theme.colors.secondary.main};
  color: ${theme.colors.secondary.contrastText};
  
  &:hover, &:focus {
    background-color: ${theme.colors.secondary.dark};
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.sm};
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Outline button variant
const OutlineButton = styled(BaseButton)`
  background-color: transparent;
  color: ${theme.colors.primary.main};
  border: ${theme.borders.width.thin} solid ${theme.colors.primary.main};
  
  &:hover, &:focus {
    background-color: ${theme.colors.primary.main}10;
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Text button variant
const TextButton = styled(BaseButton)`
  background-color: transparent;
  color: ${theme.colors.primary.main};
  padding: ${({ size }) => 
    size === 'sm' ? '4px 8px' : 
    size === 'lg' ? '8px 16px' : 
    '6px 12px'};
  
  &:hover, &:focus {
    background-color: ${theme.colors.primary.main}10;
  }
`;

// Danger button variant
const DangerButton = styled(BaseButton)`
  background-color: ${theme.colors.status.danger};
  color: white;
  
  &:hover, &:focus {
    background-color: #c0392b;
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.sm};
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

/**
 * Button Component
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline, text, danger)
 * @param {string} [props.size='md'] - Button size (sm, md, lg)
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {boolean} [props.fullWidth=false] - Whether the button should take full width
 * @param {React.ReactNode} [props.startIcon] - Icon to show at the start of the button
 * @param {React.ReactNode} [props.endIcon] - Icon to show at the end of the button
 * @param {React.ReactNode} [props.children] - Button content
 * @param {string} [props.type='button'] - Button type attribute
 * @param {function} [props.onClick] - Click handler
 */
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  children,
  type = 'button',
  onClick,
  ...rest
}) => {
  // Determine which styled component to use based on variant
  const ButtonComponent = {
    primary: PrimaryButton,
    secondary: SecondaryButton,
    outline: OutlineButton,
    text: TextButton,
    danger: DangerButton
  }[variant] || PrimaryButton;

  const hasIcon = startIcon || endIcon;
  const iconOnly = hasIcon && !children;

  return (
    <ButtonComponent
      type={type}
      size={size}
      disabled={disabled}
      fullWidth={fullWidth}
      withIcon={hasIcon}
      iconOnly={iconOnly}
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </ButtonComponent>
  );
};

export default Button; 