import React, { FC } from 'react';
import { getIcon, Icon } from './utility';

interface FileIconProps {
  filename?: string;
  icon?: Icon
}

const FileIcon: FC<FileIconProps> = React.memo(({ filename, icon, ...otherProps }) => {
  let selectedIcon = icon || { svg: '' };
  if (!icon && filename) {
    selectedIcon = getIcon(filename);
  }
  return <div {...otherProps} dangerouslySetInnerHTML={{ __html: selectedIcon.svg }} />;
});

export default FileIcon;