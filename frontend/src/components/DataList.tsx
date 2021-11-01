import React from "react";
import AreaData from "./AreaData";

type Props = {    
    areaDataMap: Map<number, AreaData>;
}

/**
 * React component that is a list of the area data
 */
export default class DataList extends React.Component<Props> {
    render () {
        const listItems: JSX.Element[] = [];
        this.props.areaDataMap.forEach((value, key) => {
            listItems.push(<li key={key}>{key} {value.owner} {value.tokenUri} {value.size.x1} {value.size.y1} {value.size.x2} {value.size.y2}</li>);
        })
        return (
            <div>
                <h4>Area Data</h4>
                <ul>{listItems}</ul>
            </div>
        )
    }
}
