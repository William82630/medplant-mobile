import React from 'react';
import MarkdownDisplay from 'react-native-markdown-display';
import { View } from 'react-native';

type Props = { children: string };

export default function Markdown({ children }: Props) {
  return (
    <View>
      <MarkdownDisplay>{children}</MarkdownDisplay>
    </View>
  );
}
