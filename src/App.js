import React from 'react';
import CSV from 'CSV-JS';
import CsvTable from './components/CsvTable.js';
import DonationReceipt from './components/DonationReceipt.js';
import OpenButton from './components/OpenButton.js';
import DonationReceiptsGenerationButton from './components/DonationReceiptsGenerationButton.js';

class App extends React.Component {
    constructor(props) {
        super(props);

        this.onFileOpened = this.onFileOpened.bind(this);
        this.onPrintPreviewClicked = this.onPrintPreviewClicked.bind(this);
        this.onCopyStampToggle = this.onCopyStampToggle.bind(this);

        this.state = {
            file: null,
            csvRows: [],
            showCopyStamp: false,
            groupedDonationRows: []
        };
    }

    onFileOpened(file) {
        var $this = this;

        var reader = new FileReader();
        reader.onload = function(e) {
            CSV.RELAXED = true;
            CSV.COLUMN_SEPARATOR = ';';

            var fileContent = e.target.result;
            //var csvRows = CSV.parse(convertLatin1ToUtf8(fileContent));
            var csvRows = CSV.parse(fileContent);
            var headerRow = csvRows[0];

            // convert rows to objects
            for (var i = 0; i < csvRows.length; i++) {
                var obj = {};
                for (var j = 0; j < csvRows[i].length; j++) {
                    var key = headerRow[j];
                    obj[key] = csvRows[i][j];
                }
                csvRows[i] = obj;
            }

            $this.setState({
                file: file,
                csvRows: csvRows,
                groupedDonationRows: []
            });
        };
        reader.readAsText(file, 'ISO-8859-1');
    }

    onPrintPreviewClicked() {
        var groupedByDonator = {};

        for (var i = 1; i < this.state.csvRows.length; i++) {
            var row = this.state.csvRows[i];
            var account = parseInt(row['KONTO']);
            var donatorId = row['MITNUM'];
            if (3221 === account || 3222 === account) {
                if (groupedByDonator[donatorId]) {
                    groupedByDonator[donatorId].push(row);
                } else {
                    groupedByDonator[donatorId] = [row];
                }
            }
        }

        // Konvert the object with the grouped donations to an array and sort it
        // by the names of the donators.
        var groupedDonationRows = Object.values(groupedByDonator).sort(function (a, b) {
            var aName = a[0]['NAME'] + ' ' + a[0]['VORNAME'];
            var bName = b[0]['NAME'] + ' ' + b[0]['VORNAME'];

            if (aName > bName) {
                return 1;
            } else if (aName < bName) {
                return -1;
            }
            return 0;
        });

        this.setState({groupedDonationRows: groupedDonationRows});
    }

    onCopyStampToggle() {
        this.setState({showCopyStamp: !this.state.showCopyStamp});
    }

    render() {
        const $this = this;
        var content;

        if (this.state.groupedDonationRows.length > 0) {
            content = (
                <div>
                    <div className="text-center mt-2">
                        <label>
                            <input type="checkbox"
                                   value="1"
                                   checked={this.state.showCopyStamp}
                                   onChange={this.onCopyStampToggle} />
                            Stempel "Kopie" aufdrucken
                        </label>
                    </div>
                    {this.state.groupedDonationRows.map(function (donationRows) {
                        return(
                            <DonationReceipt
                                key={donationRows[0]['MITNUM']}
                                donationRows={donationRows}
                                showCopyStamp={$this.state.showCopyStamp} />
                        );
                    })}
                </div>);
        } else if (this.state.file) {
            content = (<CsvTable rows={this.state.csvRows}></CsvTable>);
        } else {
            content = (<div></div>);
        }

        return (
            <div className="App">
                <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                    <a className="navbar-brand" href="index.html">ECGPB Zuwendungsbestätigungen</a>
                    <div className="collapse navbar-collapse" id="navbar-collapse">
                    <div className="ml-auto">
                        <OpenButton onFileOpened={this.onFileOpened} />
                        <DonationReceiptsGenerationButton
                            onClick={this.onPrintPreviewClicked}
                            disabled={this.state.csvRows.length === 0}
                        />
                        </div>
                    </div>
                </nav>
                {content}
            </div>
        );
    }
}

export default App;
