import { Image } from '@chakra-ui/react';
import icon from './BaseIcon.svg';

export function BaseIcon({ ...props }) {
  return <Image src={icon} alt="Base" {...props} />;
}
