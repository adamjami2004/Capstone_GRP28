// app/components/ui/RemoteSvg.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';

const RemoteSvg = ({ uri, width, height }) => {
  const [svgXmlData, setSvgXmlData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSvg() {
      try {
        const response = await fetch(uri);
        const xml = await response.text();
        setSvgXmlData(xml);
      } catch (error) {
        console.error("Error fetching SVG: ", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSvg();
  }, [uri]);

  if (loading) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!svgXmlData) {
    return null;
  }

  return <SvgXml xml={svgXmlData} width={width} height={height} />;
};

export default RemoteSvg;
